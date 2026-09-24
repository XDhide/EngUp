#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TEST API TOÀN BỘ BACKEND (English Learning API)
================================================

Script này gọi tuần tự hầu hết các endpoint của backend (Express + Sequelize)
để kiểm tra API có hoạt động đúng hay không, dùng dữ liệu được tạo bởi
`seed/seed.js`.

CÁCH DÙNG
---------
1. Cài thư viện cần thiết (chỉ cần "requests"):
       pip install requests --break-system-packages

2. Khởi động backend (đảm bảo đã cấu hình DB trong .env và đã `npm run db:sync`):
       npm run start        # hoặc: npm run dev

3. Seed dữ liệu mẫu (chỉ cần chạy 1 lần, có thể chạy lại an toàn):
       node seed/seed.js

4. Chạy test:
       python test/test_api.py
       # hoặc chỉ định base url / tài khoản khác:
       python test/test_api.py --base-url http://localhost:5000/api

KẾT QUẢ
-------
- In ra từng test: PASS / FAIL / SKIP kèm mã trạng thái HTTP và ghi chú.
- Một số API phụ thuộc dịch vụ ngoài (AI chấm bài viết / sinh bài đọc bằng
  Gemini) sẽ được đánh dấu SKIP/EXPECTED-FAIL nếu chưa cấu hình API key
  trong .env (WRITING_LLM_API_KEY, AI_GENERATION_URL) — đây không phải lỗi
  của code, chỉ là thiếu cấu hình bên ngoài.
- Kết thúc script in ra bảng tổng kết số lượng PASS/FAIL/SKIP.
"""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime

try:
    import requests
except ImportError:
    print("Thiếu thư viện 'requests'. Cài đặt bằng: pip install requests --break-system-packages")
    sys.exit(1)


# ------------------------------------------------------------------
# Cấu hình mặc định (khớp với dữ liệu seed trong seed/seed.js)
# ------------------------------------------------------------------
DEFAULT_BASE_URL = "http://localhost:5000/api"

ADMIN_ACCOUNT = {"email": "admin@engup.test", "password": "Admin@123"}
STUDENT_ACCOUNT = {"email": "student1@engup.test", "password": "Student@123"}

# Tài khoản mới sẽ được đăng ký ngẫu nhiên mỗi lần chạy để test /auth/register
RANDOM_SUFFIX = str(int(time.time()))
NEW_ACCOUNT = {
    "email": f"test.user.{RANDOM_SUFFIX}@engup.test",
    "password": "NewUser@123",
    "full_name": "Người Dùng Test"
}


class Colors:
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    BOLD = "\033[1m"
    END = "\033[0m"


class ApiTester:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.results = []  # list of dict: name, status(PASS/FAIL/SKIP), detail

        # Tokens / state được chia sẻ giữa các test
        self.state = {}

    # ---------------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------------
    def _url(self, path):
        return f"{self.base_url}{path}"

    def request(self, method, path, token=None, expected_status=None, **kwargs):
        headers = kwargs.pop("headers", {})
        if token:
            headers["Authorization"] = f"Bearer {token}"
        try:
            resp = self.session.request(method, self._url(path), headers=headers, timeout=20, **kwargs)
        except requests.exceptions.ConnectionError:
            return None, f"Không kết nối được tới {self._url(path)}. Backend đã chạy chưa?"
        return resp, None

    def record(self, name, status, detail=""):
        self.results.append({"name": name, "status": status, "detail": detail})
        color = {
            "PASS": Colors.GREEN,
            "FAIL": Colors.RED,
            "SKIP": Colors.YELLOW,
        }.get(status, "")
        print(f"{color}[{status}]{Colors.END} {name}" + (f" — {detail}" if detail else ""))

    def check(self, name, condition, resp, note=""):
        """condition: bool. If resp is None (connection error) always FAIL."""
        if resp is None:
            self.record(name, "FAIL", note or "Không có phản hồi từ server")
            return False
        detail = f"HTTP {resp.status_code}"
        if note:
            detail += f" | {note}"
        if condition:
            self.record(name, "PASS", detail)
            return True
        else:
            body_preview = self._safe_body_preview(resp)
            if resp.status_code == 429:
                detail += " | Bị rate limit: khởi động server với RATE_LIMIT_MAX=1000 (xem TESTING.md)"
            self.record(name, "FAIL", detail + f" | body: {body_preview}")
            return False

    def skip(self, name, reason):
        self.record(name, "SKIP", reason)

    @staticmethod
    def _safe_body_preview(resp):
        try:
            data = resp.json()
            text = json.dumps(data, ensure_ascii=False)
        except Exception:
            text = resp.text
        return (text[:200] + "...") if len(text) > 200 else text

    @staticmethod
    def _data(resp):
        try:
            return resp.json().get("data")
        except Exception:
            return None

    # ---------------------------------------------------------------
    # 1. AUTH
    # ---------------------------------------------------------------
    def test_auth(self):
        print(f"\n{Colors.BOLD}=== 1. AUTH (/auth) ==={Colors.END}")

        # 1.1 Register (tài khoản mới ngẫu nhiên)
        resp, err = self.request("POST", "/auth/register", json=NEW_ACCOUNT)
        ok = self.check(
            "POST /auth/register (tài khoản mới)",
            resp is not None and resp.status_code == 201,
            resp
        )

        # 1.2 Register trùng email -> phải lỗi (400/409)
        resp, err = self.request("POST", "/auth/register", json=NEW_ACCOUNT)
        self.check(
            "POST /auth/register (email trùng -> phải lỗi)",
            resp is not None and resp.status_code >= 400,
            resp
        )

        # 1.3 Register thiếu field -> 400
        resp, err = self.request("POST", "/auth/register", json={"email": "bad-email"})
        self.check(
            "POST /auth/register (thiếu field -> 400)",
            resp is not None and resp.status_code == 400,
            resp
        )

        # 1.4 Login tài khoản học sinh (đã seed sẵn)
        resp, err = self.request("POST", "/auth/login", json=STUDENT_ACCOUNT)
        ok = self.check(
            "POST /auth/login (student1 - đã seed)",
            resp is not None and resp.status_code == 200 and self._data(resp) and "access_token" in self._data(resp),
            resp,
            "Cần chạy seed/seed.js trước nếu FAIL"
        )
        if ok:
            data = self._data(resp)
            self.state["student_access_token"] = data["access_token"]
            self.state["student_refresh_token"] = data["refresh_token"]
            self.state["student_id"] = data["user"]["id"]

        # 1.5 Login sai mật khẩu -> 401
        resp, err = self.request("POST", "/auth/login", json={"email": STUDENT_ACCOUNT["email"], "password": "wrong"})
        self.check(
            "POST /auth/login (sai mật khẩu -> 401)",
            resp is not None and resp.status_code == 401,
            resp
        )

        # 1.6 Login admin
        resp, err = self.request("POST", "/auth/login", json=ADMIN_ACCOUNT)
        ok = self.check(
            "POST /auth/login (admin - đã seed)",
            resp is not None and resp.status_code == 200 and self._data(resp) and "access_token" in self._data(resp),
            resp,
            "Cần chạy seed/seed.js trước nếu FAIL"
        )
        if ok:
            self.state["admin_access_token"] = self._data(resp)["access_token"]

        # 1.7 GET /auth/me (cần token)
        token = self.state.get("student_access_token")
        if token:
            resp, err = self.request("GET", "/auth/me", token=token)
            self.check("GET /auth/me (có token)", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip("GET /auth/me", "Không có token student (login thất bại ở bước trước)")

        # 1.8 GET /auth/me không có token -> 401
        resp, err = self.request("GET", "/auth/me")
        self.check("GET /auth/me (không token -> 401)", resp is not None and resp.status_code == 401, resp)

        # 1.9 PUT /auth/me cập nhật hồ sơ
        if token:
            resp, err = self.request(
                "PUT", "/auth/me", token=token,
                json={"learning_goal": "Luyện phản xạ giao tiếp", "daily_target_minutes": 25}
            )
            self.check("PUT /auth/me (cập nhật hồ sơ)", resp is not None and resp.status_code == 200, resp)

            # field không hợp lệ
            resp, err = self.request("PUT", "/auth/me", token=token, json={"unknown_field": 1})
            self.check("PUT /auth/me (field lạ -> 400)", resp is not None and resp.status_code == 400, resp)
        else:
            self.skip("PUT /auth/me", "Không có token")

        # 1.10 GET placement test questions (public, cần token theo route? kiểm tra không cần auth)
        resp, err = self.request("GET", "/auth/placement-test/questions")
        ok = self.check("GET /auth/placement-test/questions", resp is not None and resp.status_code == 200, resp)
        placement_questions = self._data(resp) if ok else None

        # 1.11 Submit placement test
        if token and placement_questions:
            questions = placement_questions.get("questions", placement_questions) \
                if isinstance(placement_questions, dict) else placement_questions
            answers = []
            try:
                for q in questions[:5]:
                    answers.append({"question_id": q["id"], "answer": q["options"][0]["id"]})
            except Exception:
                answers = [{"question_id": 1, "answer": "b"}]
            resp, err = self.request(
                "POST", "/auth/placement-test/submit", token=token, json={"answers": answers}
            )
            self.check("POST /auth/placement-test/submit", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip("POST /auth/placement-test/submit", "Thiếu token hoặc danh sách câu hỏi")

        # 1.12 Refresh token
        rtoken = self.state.get("student_refresh_token")
        if rtoken:
            resp, err = self.request("POST", "/auth/refresh", json={"refresh_token": rtoken})
            self.check("POST /auth/refresh", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip("POST /auth/refresh", "Không có refresh token")

        # 1.13 Logout (dùng refresh token cũ, kèm access token còn hạn)
        if token and rtoken:
            resp, err = self.request("POST", "/auth/logout", token=token, json={"refresh_token": rtoken})
            self.check("POST /auth/logout", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip("POST /auth/logout", "Thiếu token")

    # ---------------------------------------------------------------
    # 2. ADMIN AUTH
    # ---------------------------------------------------------------
    def test_admin_auth(self):
        print(f"\n{Colors.BOLD}=== 2. ADMIN AUTH (/admin/auth) ==={Colors.END}")

        resp, err = self.request("POST", "/admin/auth/login", json=ADMIN_ACCOUNT)
        self.check("POST /admin/auth/login (admin hợp lệ)", resp is not None and resp.status_code == 200, resp)

        # Học sinh thường đăng nhập trang admin -> phải bị từ chối 403
        resp, err = self.request("POST", "/admin/auth/login", json=STUDENT_ACCOUNT)
        self.check(
            "POST /admin/auth/login (tài khoản student -> 403)",
            resp is not None and resp.status_code == 403,
            resp
        )

    # ---------------------------------------------------------------
    # 3. VOCABULARY + REVIEW
    # ---------------------------------------------------------------
    def test_vocabulary(self):
        print(f"\n{Colors.BOLD}=== 3. VOCABULARY (/vocabulary, /review) ==={Colors.END}")
        token = self.state.get("student_access_token")
        admin_token = self.state.get("admin_access_token")
        if not token:
            self.skip("Vocabulary tests", "Không có student token")
            return

        # 3.1 GET topics
        resp, err = self.request("GET", "/vocabulary/topics", token=token)
        self.check("GET /vocabulary/topics", resp is not None and resp.status_code == 200, resp)

        # 3.2 GET words
        resp, err = self.request("GET", "/vocabulary/words", token=token)
        ok = self.check("GET /vocabulary/words", resp is not None and resp.status_code == 200, resp)
        words = self._data(resp) if ok else None

        # 3.3 Student tạo từ mới -> phải bị từ chối (chỉ admin)
        resp, err = self.request(
            "POST", "/vocabulary/words", token=token,
            json={"word": "unauthorized-word", "meaning": "không được phép"}
        )
        self.check(
            "POST /vocabulary/words (student -> 403 vì chỉ admin)",
            resp is not None and resp.status_code == 403,
            resp
        )

        # 3.4 Admin tạo từ mới -> 201
        new_word_id = None
        if admin_token:
            resp, err = self.request(
                "POST", "/vocabulary/words", token=admin_token,
                json={
                    "word": f"testword{RANDOM_SUFFIX}",
                    "meaning": "từ kiểm thử",
                    "example_sentence": "This is a test word.",
                    "difficulty": "A1"
                }
            )
            ok = self.check("POST /vocabulary/words (admin -> 201)", resp is not None and resp.status_code == 201, resp)
            if ok:
                new_word_id = self._data(resp).get("id") if isinstance(self._data(resp), dict) else None
        else:
            self.skip("POST /vocabulary/words (admin)", "Không có admin token")

        # 3.5 Admin sửa từ vừa tạo
        if admin_token and new_word_id:
            resp, err = self.request(
                "PUT", f"/vocabulary/words/{new_word_id}", token=admin_token,
                json={"meaning": "từ kiểm thử (đã sửa)"}
            )
            self.check("PUT /vocabulary/words/:id (admin)", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip("PUT /vocabulary/words/:id", "Không có admin token hoặc word_id")

        # 3.6 GET new-words trong ngày
        resp, err = self.request("GET", "/vocabulary/new-words", token=token)
        self.check("GET /vocabulary/new-words", resp is not None and resp.status_code == 200, resp)

        # 3.7 Cập nhật giới hạn từ mới/ngày
        resp, err = self.request(
            "PUT", "/vocabulary/daily-new-word-limit", token=token, json={"limit": 15}
        )
        self.check("PUT /vocabulary/daily-new-word-limit", resp is not None and resp.status_code == 200, resp)

        # 3.7b limit không hợp lệ -> 400
        resp, err = self.request(
            "PUT", "/vocabulary/daily-new-word-limit", token=token, json={"limit": -1}
        )
        self.check("PUT /vocabulary/daily-new-word-limit (limit âm -> 400)", resp is not None and resp.status_code == 400, resp)

        # 3.8 GET /review/today
        resp, err = self.request("GET", "/review/today", token=token)
        ok = self.check("GET /review/today", resp is not None and resp.status_code == 200, resp)
        review_cards = self._data(resp) if ok else None

        # 3.9 POST /review/submit (nếu có card để ôn tập)
        card_id = None
        try:
            cards_list = review_cards.get("cards", review_cards) if isinstance(review_cards, dict) else review_cards
            if cards_list:
                card_id = cards_list[0].get("card_id") or cards_list[0].get("id")
        except Exception:
            card_id = None

        if card_id:
            resp, err = self.request(
                "POST", "/review/submit", token=token,
                json={"card_id": card_id, "result": "good", "response_time_ms": 2500}
            )
            self.check("POST /review/submit", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip(
                "POST /review/submit",
                "Chưa có thẻ ôn tập nào đến hạn hôm nay cho user này (không phải lỗi API)"
            )

        # 3.10 result không hợp lệ -> 400
        resp, err = self.request(
            "POST", "/review/submit", token=token, json={"card_id": 1, "result": "invalid_value"}
        )
        self.check("POST /review/submit (result sai -> 400)", resp is not None and resp.status_code == 400, resp)

        # 3.11 Admin xoá từ đã tạo (dọn dẹp)
        if admin_token and new_word_id:
            resp, err = self.request("DELETE", f"/vocabulary/words/{new_word_id}", token=admin_token)
            self.check("DELETE /vocabulary/words/:id (admin, dọn dẹp)", resp is not None and resp.status_code == 200, resp)

    # ---------------------------------------------------------------
    # 4. NOTEBOOK
    # ---------------------------------------------------------------
    def test_notebook(self):
        print(f"\n{Colors.BOLD}=== 4. NOTEBOOK (/notebook) ==={Colors.END}")
        token = self.state.get("student_access_token")
        if not token:
            self.skip("Notebook tests", "Không có student token")
            return

        # Lấy 1 word_id có thật từ /vocabulary/words để tạo entry hợp lệ
        resp, err = self.request("GET", "/vocabulary/words", token=token)
        words_data = self._data(resp) if resp is not None and resp.status_code == 200 else None
        word_list = words_data.get("words", words_data) if isinstance(words_data, dict) else words_data
        word_id = None
        try:
            word_id = word_list[0]["id"] if word_list else None
        except Exception:
            word_id = None

        if not word_id:
            self.skip("POST /notebook (tạo entry)", "Không tìm thấy word_id nào (chạy seed/seed.js trước)")
            return

        # 4.1 Tạo entry
        resp, err = self.request(
            "POST", "/notebook", token=token,
            json={"word_id": word_id, "source_type": "vocabulary", "note": "Từ cần ôn lại", "tags": ["quan-trong"]}
        )
        ok = self.check("POST /notebook (tạo entry)", resp is not None and resp.status_code == 201, resp)
        entry_id = None
        if ok:
            d = self._data(resp)
            entry_id = d.get("id") if isinstance(d, dict) else None

        # 4.2 Tạo entry thiếu source_type -> 400
        resp, err = self.request("POST", "/notebook", token=token, json={"word_id": word_id})
        self.check("POST /notebook (thiếu source_type -> 400)", resp is not None and resp.status_code == 400, resp)

        # 4.3 GET list
        resp, err = self.request("GET", "/notebook", token=token)
        self.check("GET /notebook", resp is not None and resp.status_code == 200, resp)

        # 4.4 GET list với filter source_type
        resp, err = self.request("GET", "/notebook", token=token, params={"source_type": "vocabulary"})
        self.check("GET /notebook?source_type=vocabulary", resp is not None and resp.status_code == 200, resp)

        # 4.5 Update entry
        if entry_id:
            resp, err = self.request(
                "PUT", f"/notebook/{entry_id}", token=token, json={"note": "Đã cập nhật ghi chú"}
            )
            self.check("PUT /notebook/:id", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip("PUT /notebook/:id", "Không có entry_id")

        # 4.6 Update entry không có field nào -> 400
        if entry_id:
            resp, err = self.request("PUT", f"/notebook/{entry_id}", token=token, json={})
            self.check("PUT /notebook/:id (rỗng -> 400)", resp is not None and resp.status_code == 400, resp)

        # 4.7 Delete entry (dọn dẹp)
        if entry_id:
            resp, err = self.request("DELETE", f"/notebook/{entry_id}", token=token)
            self.check("DELETE /notebook/:id", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip("DELETE /notebook/:id", "Không có entry_id")

    # ---------------------------------------------------------------
    # 5. READING
    # ---------------------------------------------------------------
    def test_reading(self):
        print(f"\n{Colors.BOLD}=== 5. READING (/reading) ==={Colors.END}")
        token = self.state.get("student_access_token")
        if not token:
            self.skip("Reading tests", "Không có student token")
            return

        # 5.1 GET articles
        resp, err = self.request("GET", "/reading/articles", token=token)
        ok = self.check("GET /reading/articles", resp is not None and resp.status_code == 200, resp)
        articles_data = self._data(resp) if ok else None
        articles = articles_data.get("articles", articles_data) if isinstance(articles_data, dict) else articles_data
        article_id = None
        try:
            article_id = articles[0]["id"] if articles else None
        except Exception:
            article_id = None

        # 5.2 GET articles filter difficulty không hợp lệ -> 400
        resp, err = self.request("GET", "/reading/articles", token=token, params={"difficulty": "Z9"})
        self.check("GET /reading/articles?difficulty=Z9 (-> 400)", resp is not None and resp.status_code == 400, resp)

        if not article_id:
            self.skip("GET /reading/articles/:id và các test liên quan", "Không có bài đọc nào (chạy seed/seed.js trước)")
            return

        # 5.3 GET article detail
        resp, err = self.request("GET", f"/reading/articles/{article_id}", token=token)
        ok = self.check("GET /reading/articles/:id", resp is not None and resp.status_code == 200, resp)
        detail = self._data(resp) if ok else None
        questions = detail.get("questions") if isinstance(detail, dict) else None

        # 5.4 GET article detail với id không tồn tại -> 404
        resp, err = self.request("GET", "/reading/articles/999999", token=token)
        self.check("GET /reading/articles/999999 (-> 404)", resp is not None and resp.status_code == 404, resp)

        # 5.5 Submit answers
        if questions:
            answers = [{"question_id": q["id"], "answer": q["options"][0][0]} for q in questions]
            resp, err = self.request(
                "POST", f"/reading/articles/{article_id}/submit", token=token, json={"answers": answers}
            )
            self.check("POST /reading/articles/:id/submit", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip("POST /reading/articles/:id/submit", "Bài đọc không có câu hỏi")

        # 5.6 Submit answers rỗng -> 400
        resp, err = self.request(
            "POST", f"/reading/articles/{article_id}/submit", token=token, json={"answers": []}
        )
        self.check("POST /reading/articles/:id/submit (answers rỗng -> 400)", resp is not None and resp.status_code == 400, resp)

        # 5.7 Generate article bằng AI — chỉ admin mới có quyền (assertAdmin trong service)
        admin_token = self.state.get("admin_access_token")

        # Student gọi -> phải bị từ chối 403
        resp, err = self.request(
            "POST", "/reading/generate", token=token, json={"topic": "Environment", "difficulty": "B1"}
        )
        self.check(
            "POST /reading/generate (student -> 403 vì chỉ admin)",
            resp is not None and resp.status_code == 403,
            resp
        )

        # Admin gọi -> cần cấu hình AI_GENERATION_URL, nếu chưa có sẽ trả 502
        if admin_token:
            resp, err = self.request(
                "POST", "/reading/generate", token=admin_token, json={"topic": "Environment", "difficulty": "B1"}
            )
            if resp is not None and resp.status_code == 502:
                self.skip(
                    "POST /reading/generate (admin)",
                    "Trả về 502 vì chưa cấu hình AI_GENERATION_URL trong .env — không phải lỗi code"
                )
            else:
                self.check("POST /reading/generate (admin)", resp is not None and resp.status_code == 201, resp)
        else:
            self.skip("POST /reading/generate (admin)", "Không có admin token")

    # ---------------------------------------------------------------
    # 6. LISTENING
    # ---------------------------------------------------------------
    def test_listening(self):
        print(f"\n{Colors.BOLD}=== 6. LISTENING (/listening) ==={Colors.END}")
        token = self.state.get("student_access_token")
        if not token:
            self.skip("Listening tests", "Không có student token")
            return

        # 6.1 GET lessons
        resp, err = self.request("GET", "/listening/lessons", token=token)
        ok = self.check("GET /listening/lessons", resp is not None and resp.status_code == 200, resp)
        lessons_data = self._data(resp) if ok else None
        lessons = lessons_data.get("lessons", lessons_data) if isinstance(lessons_data, dict) else lessons_data
        lesson_id = None
        try:
            lesson_id = lessons[0]["id"] if lessons else None
        except Exception:
            lesson_id = None

        if not lesson_id:
            self.skip("Các test còn lại của Listening", "Không có bài nghe nào (chạy seed/seed.js trước)")
            return

        # 6.2 GET lesson detail
        resp, err = self.request("GET", f"/listening/lessons/{lesson_id}", token=token)
        self.check("GET /listening/lessons/:id", resp is not None and resp.status_code == 200, resp)

        # 6.3 GET lesson detail id không tồn tại -> 404
        resp, err = self.request("GET", "/listening/lessons/999999", token=token)
        self.check("GET /listening/lessons/999999 (-> 404)", resp is not None and resp.status_code == 404, resp)

        # 6.4 Submit dictation
        resp, err = self.request(
            "POST", f"/listening/lessons/{lesson_id}/dictation", token=token,
            json={"user_text": "Hi can I get a medium latte with oat milk please"}
        )
        self.check("POST /listening/lessons/:id/dictation", resp is not None and resp.status_code == 200, resp)

        # 6.5 Submit dictation thiếu user_text -> 400
        resp, err = self.request(
            "POST", f"/listening/lessons/{lesson_id}/dictation", token=token, json={}
        )
        self.check("POST /listening/lessons/:id/dictation (thiếu user_text -> 400)", resp is not None and resp.status_code == 400, resp)

    # ---------------------------------------------------------------
    # 7. WRITING
    # ---------------------------------------------------------------
    def test_writing(self):
        print(f"\n{Colors.BOLD}=== 7. WRITING (/writing) ==={Colors.END}")
        token = self.state.get("student_access_token")
        if not token:
            self.skip("Writing tests", "Không có student token")
            return

        # 7.1 GET prompts
        resp, err = self.request("GET", "/writing/prompts", token=token)
        ok = self.check("GET /writing/prompts", resp is not None and resp.status_code == 200, resp)
        prompts_data = self._data(resp) if ok else None
        prompts = prompts_data.get("prompts", prompts_data) if isinstance(prompts_data, dict) else prompts_data
        prompt_id = None
        try:
            prompt_id = prompts[0]["id"] if prompts else None
        except Exception:
            prompt_id = None

        # 7.2 GET prompts filter type không hợp lệ -> 400
        resp, err = self.request("GET", "/writing/prompts", token=token, params={"type": "invalid"})
        self.check("GET /writing/prompts?type=invalid (-> 400)", resp is not None and resp.status_code == 400, resp)

        if not prompt_id:
            self.skip("Các test còn lại của Writing", "Không có đề bài viết nào (chạy seed/seed.js trước)")
            return

        # 7.3 Tạo submission (cần WRITING_LLM_API_KEY để chấm bằng AI -> có thể trả 502 nếu chưa cấu hình)
        resp, err = self.request(
            "POST", "/writing/submissions", token=token,
            json={
                "prompt_id": prompt_id,
                "content": "My hometown is a small and peaceful town. I love it because of the fresh air "
                           "and friendly people. Every weekend, I enjoy walking along the river with my family."
            }
        )
        submission_id = None
        if resp is not None and resp.status_code == 502:
            self.skip(
                "POST /writing/submissions",
                "Trả về 502 vì chưa cấu hình WRITING_LLM_API_KEY trong .env — không phải lỗi code"
            )
        else:
            ok = self.check("POST /writing/submissions", resp is not None and resp.status_code == 201, resp)
            if ok:
                d = self._data(resp)
                submission_id = d.get("id") if isinstance(d, dict) else None

        # 7.4 Tạo submission thiếu content -> 400
        resp, err = self.request(
            "POST", "/writing/submissions", token=token, json={"prompt_id": prompt_id}
        )
        self.check("POST /writing/submissions (thiếu content -> 400)", resp is not None and resp.status_code == 400, resp)

        # 7.5 GET submissions list
        resp, err = self.request("GET", "/writing/submissions", token=token)
        self.check("GET /writing/submissions", resp is not None and resp.status_code == 200, resp)

        # 7.6 GET submission detail (nếu có submission_id từ bước 7.3)
        if submission_id:
            resp, err = self.request("GET", f"/writing/submissions/{submission_id}", token=token)
            self.check("GET /writing/submissions/:id", resp is not None and resp.status_code == 200, resp)
        else:
            self.skip("GET /writing/submissions/:id", "Chưa có submission nào được chấm thành công")

    # ---------------------------------------------------------------
    # 8. STATISTICS
    # ---------------------------------------------------------------
    def test_statistics(self):
        print(f"\n{Colors.BOLD}=== 8. STATISTICS (/stats) ==={Colors.END}")
        token = self.state.get("student_access_token")
        if not token:
            self.skip("Statistics tests", "Không có student token")
            return

        resp, err = self.request("GET", "/stats/overview", token=token)
        self.check("GET /stats/overview", resp is not None and resp.status_code == 200, resp)

        resp, err = self.request("GET", "/stats/progress", token=token)
        self.check("GET /stats/progress (mặc định 7d)", resp is not None and resp.status_code == 200, resp)

        resp, err = self.request("GET", "/stats/progress", token=token, params={"range": "30d"})
        self.check("GET /stats/progress?range=30d", resp is not None and resp.status_code == 200, resp)

        resp, err = self.request("GET", "/stats/progress", token=token, params={"range": "invalid"})
        self.check("GET /stats/progress?range=invalid (-> 400)", resp is not None and resp.status_code == 400, resp)

    # ---------------------------------------------------------------
    # 9. ADMIN CONTENT APPROVAL
    # ---------------------------------------------------------------
    def _run_fixture(self, mode, payload=None, script="approval_fixtures.js"):
        """Gọi một helper Node trong test/helpers/ (tạo/kiểm tra/dọn dữ liệu thử trong DB).
        Trả về (dict, None) nếu thành công hoặc (None, thông_báo_lỗi)."""
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        script_path = os.path.join(project_root, "test", "helpers", script)
        try:
            proc = subprocess.run(
                ["node", script_path, mode],
                input=json.dumps(payload or {}),
                capture_output=True, encoding="utf-8", cwd=project_root, timeout=60,
            )
        except FileNotFoundError:
            return None, "Không tìm thấy lệnh 'node' trong PATH"
        except subprocess.TimeoutExpired:
            return None, "Helper chạy quá 60 giây"

        lines = [ln for ln in proc.stdout.strip().splitlines() if ln.strip()]
        if not lines:
            return None, (proc.stderr.strip()[:200] or "Helper không in ra kết quả nào")
        try:
            data = json.loads(lines[-1])
        except ValueError:
            return None, f"Kết quả helper không phải JSON: {lines[-1][:200]}"
        if proc.returncode != 0 or "error" in data:
            return None, data.get("error", "Helper thất bại")
        return data, None

    def _check_db(self, name, condition, detail=""):
        """Ghi kết quả một phép kiểm tra trực tiếp trên DB (không có HTTP response)."""
        self.record(name, "PASS" if condition else "FAIL", detail)

    def test_admin_content_approval(self):
        print(f"\n{Colors.BOLD}=== 9. ADMIN CONTENT APPROVAL (/admin/content) ==={Colors.END}")
        admin_token = self.state.get("admin_access_token")
        student_token = self.state.get("student_access_token")
        if not admin_token:
            self.skip("Admin content approval tests", "Không có admin token")
            return

        base = "/admin/content"

        # 9.1 Không có token -> 401
        resp, err = self.request("GET", f"{base}/pending")
        self.check("GET /admin/content/pending (không token -> 401)", resp is not None and resp.status_code == 401, resp)

        # 9.2 Student -> 403 (cả 3 endpoint)
        if student_token:
            resp, err = self.request("GET", f"{base}/pending", token=student_token)
            self.check("GET /admin/content/pending (student -> 403)", resp is not None and resp.status_code == 403, resp)
            resp, err = self.request("PUT", f"{base}/1/approve", token=student_token)
            self.check("PUT /admin/content/:id/approve (student -> 403)", resp is not None and resp.status_code == 403, resp)
            resp, err = self.request("PUT", f"{base}/1/reject", token=student_token, json={"reject_reason": "x"})
            self.check("PUT /admin/content/:id/reject (student -> 403)", resp is not None and resp.status_code == 403, resp)
        else:
            self.skip("Admin content approval (student -> 403)", "Không có student token")

        # 9.3 Validation không cần dữ liệu thử
        resp, err = self.request("GET", f"{base}/pending", token=admin_token, params={"type": "invalid"})
        self.check("GET /admin/content/pending?type=invalid (-> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("PUT", f"{base}/abc/approve", token=admin_token)
        self.check("PUT /admin/content/abc/approve (id sai -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("PUT", f"{base}/99999999/approve", token=admin_token)
        self.check("PUT /admin/content/99999999/approve (-> 404)", resp is not None and resp.status_code == 404, resp)
        resp, err = self.request("PUT", f"{base}/99999999/reject", token=admin_token, json={"reject_reason": "x"})
        self.check("PUT /admin/content/99999999/reject (-> 404)", resp is not None and resp.status_code == 404, resp)

        # 9.4 Các kịch bản duyệt/từ chối cần dữ liệu thử (tạo thẳng vào DB qua helper Node)
        fixture, ferr = self._run_fixture("create")
        if not fixture:
            self.skip(
                "Kịch bản duyệt / từ chối nội dung",
                f"Không tạo được dữ liệu thử ({ferr}). Cần 'node' trong PATH, .env trỏ đúng DB và đã chạy 'npm run migrate'.",
            )
            return

        try:
            self._approval_scenarios(base, admin_token, student_token, fixture)
        finally:
            _, cerr = self._run_fixture("cleanup", fixture)
            if cerr:
                print(f"{Colors.YELLOW}⚠️  Không dọn được dữ liệu thử: {cerr}{Colors.END}")

    def _approval_scenarios(self, base, admin_token, student_token, fixture):
        art_ok, art_no = fixture["articles"]      # bài đọc sẽ duyệt / sẽ từ chối
        q_ok, q_no = fixture["questions"]         # câu hỏi sẽ duyệt / sẽ từ chối
        all_queue_ids = [art_ok["queue_id"], art_no["queue_id"], q_ok["queue_id"], q_no["queue_id"]]

        def items_of(resp):
            data = self._data(resp) or {}
            return data.get("items", []) if isinstance(data, dict) else []

        def inspect_db():
            data, e = self._run_fixture("inspect", {"queue_ids": all_queue_ids})
            return data or {}, e

        # --- GET /pending ---
        resp, err = self.request("GET", f"{base}/pending", token=admin_token)
        items = items_of(resp) if resp is not None else []
        ids = {i.get("id") for i in items}
        self.check(
            "GET /admin/content/pending (admin -> 200, có đủ 4 yêu cầu thử)",
            resp is not None and resp.status_code == 200 and set(all_queue_ids) <= ids,
            resp,
        )
        shape_ok = bool(items) and all(set(i.keys()) == {"id", "content_type", "content_id", "created_at"} for i in items)
        self._check_db("GET /admin/content/pending — mỗi item đúng 4 field {id, content_type, content_id, created_at}", shape_ok)

        resp, err = self.request("GET", f"{base}/pending", token=admin_token, params={"type": "reading_article"})
        items = items_of(resp) if resp is not None else []
        ids = {i.get("id") for i in items}
        self.check(
            "GET /admin/content/pending?type=reading_article (chỉ bài đọc)",
            resp is not None and resp.status_code == 200
            and all(i.get("content_type") == "reading_article" for i in items)
            and {art_ok["queue_id"], art_no["queue_id"]} <= ids
            and not ({q_ok["queue_id"], q_no["queue_id"]} & ids),
            resp,
        )

        resp, err = self.request("GET", f"{base}/pending", token=admin_token, params={"type": "test_question"})
        items = items_of(resp) if resp is not None else []
        ids = {i.get("id") for i in items}
        self.check(
            "GET /admin/content/pending?type=test_question (chỉ câu hỏi)",
            resp is not None and resp.status_code == 200
            and all(i.get("content_type") == "test_question" for i in items)
            and {q_ok["queue_id"], q_no["queue_id"]} <= ids
            and not ({art_ok["queue_id"], art_no["queue_id"]} & ids),
            resp,
        )

        # --- APPROVE bài đọc: kiểm tra bằng chính API reading (404 -> 200) ---
        reader = student_token or admin_token
        resp, err = self.request("GET", f"/reading/articles/{art_ok['content_id']}", token=reader)
        self.check("GET /reading/articles/:id (bài chưa duyệt -> 404)", resp is not None and resp.status_code == 404, resp)

        resp, err = self.request("PUT", f"{base}/{art_ok['queue_id']}/approve", token=admin_token)
        self.check(
            "PUT /admin/content/:id/approve (reading_article -> 200, data=null)",
            resp is not None and resp.status_code == 200 and resp.json().get("data") is None,
            resp,
        )

        resp, err = self.request("GET", f"/reading/articles/{art_ok['content_id']}", token=reader)
        self.check("GET /reading/articles/:id (sau khi duyệt -> 200)", resp is not None and resp.status_code == 200, resp)

        db_state, e = inspect_db()
        row = db_state.get(str(art_ok["queue_id"])) or {}
        self._check_db(
            "DB: queue approved + reading_articles.is_approved=true + reviewed_by/reviewed_at + 1 audit log",
            row.get("status") == "approved" and row.get("content_is_approved") is True
            and row.get("reviewed_by") is not None and row.get("reviewed_at_set") is True
            and row.get("audit_count") == 1,
            e or json.dumps(row),
        )

        resp, err = self.request("PUT", f"{base}/{art_ok['queue_id']}/approve", token=admin_token)
        self.check("PUT /admin/content/:id/approve (đã duyệt rồi -> 409)", resp is not None and resp.status_code == 409, resp)

        resp, err = self.request("PUT", f"{base}/{art_ok['queue_id']}/reject", token=admin_token, json={"reject_reason": "Muộn rồi"})
        self.check("PUT /admin/content/:id/reject (đã duyệt rồi -> 409)", resp is not None and resp.status_code == 409, resp)

        # --- APPROVE câu hỏi test ---
        resp, err = self.request("PUT", f"{base}/{q_ok['queue_id']}/approve", token=admin_token)
        self.check(
            "PUT /admin/content/:id/approve (test_question -> 200, data=null)",
            resp is not None and resp.status_code == 200 and resp.json().get("data") is None,
            resp,
        )
        db_state, e = inspect_db()
        row = db_state.get(str(q_ok["queue_id"])) or {}
        self._check_db(
            "DB: queue approved + test_questions.is_approved=true",
            row.get("status") == "approved" and row.get("content_is_approved") is True,
            e or json.dumps(row),
        )

        # --- REJECT: validation ---
        target = art_no["queue_id"]
        resp, err = self.request("PUT", f"{base}/{target}/reject", token=admin_token)
        self.check("PUT /admin/content/:id/reject (không body -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("PUT", f"{base}/{target}/reject", token=admin_token, json={"reject_reason": "   "})
        self.check("PUT /admin/content/:id/reject (reject_reason rỗng -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("PUT", f"{base}/{target}/reject", token=admin_token, json={"reject_reason": "a" * 501})
        self.check("PUT /admin/content/:id/reject (reject_reason > 500 ký tự -> 400)", resp is not None and resp.status_code == 400, resp)

        # --- REJECT bài đọc ---
        reason = "Nội dung chưa chính xác"
        resp, err = self.request("PUT", f"{base}/{target}/reject", token=admin_token, json={"reject_reason": f"  {reason}  "})
        self.check(
            "PUT /admin/content/:id/reject (reading_article -> 200, data=null)",
            resp is not None and resp.status_code == 200 and resp.json().get("data") is None,
            resp,
        )
        db_state, e = inspect_db()
        row = db_state.get(str(target)) or {}
        self._check_db(
            "DB: queue rejected + lưu reject_reason (đã trim) + bài đọc vẫn is_approved=false + 1 audit log",
            row.get("status") == "rejected" and row.get("reject_reason") == reason
            and row.get("content_is_approved") is False and row.get("reviewed_by") is not None
            and row.get("reviewed_at_set") is True and row.get("audit_count") == 1,
            e or json.dumps(row, ensure_ascii=False),
        )
        resp, err = self.request("GET", f"/reading/articles/{art_no['content_id']}", token=reader)
        self.check("GET /reading/articles/:id (bài bị từ chối vẫn -> 404)", resp is not None and resp.status_code == 404, resp)

        resp, err = self.request("PUT", f"{base}/{target}/reject", token=admin_token, json={"reject_reason": "Lần 2"})
        self.check("PUT /admin/content/:id/reject (đã từ chối rồi -> 409)", resp is not None and resp.status_code == 409, resp)
        resp, err = self.request("PUT", f"{base}/{target}/approve", token=admin_token)
        self.check("PUT /admin/content/:id/approve (đã từ chối rồi -> 409)", resp is not None and resp.status_code == 409, resp)

        # --- REJECT câu hỏi test ---
        resp, err = self.request("PUT", f"{base}/{q_no['queue_id']}/reject", token=admin_token, json={"reject_reason": "Sai đáp án"})
        self.check(
            "PUT /admin/content/:id/reject (test_question -> 200, data=null)",
            resp is not None and resp.status_code == 200 and resp.json().get("data") is None,
            resp,
        )
        db_state, e = inspect_db()
        row = db_state.get(str(q_no["queue_id"])) or {}
        self._check_db(
            "DB: queue rejected + test_questions.is_approved vẫn false",
            row.get("status") == "rejected" and row.get("reject_reason") == "Sai đáp án"
            and row.get("content_is_approved") is False,
            e or json.dumps(row, ensure_ascii=False),
        )

        # --- Hàng chờ không còn các yêu cầu đã xử lý ---
        resp, err = self.request("GET", f"{base}/pending", token=admin_token)
        ids = {i.get("id") for i in items_of(resp)} if resp is not None else set()
        self.check(
            "GET /admin/content/pending (sau khi xử lý: 4 yêu cầu thử đã biến mất)",
            resp is not None and resp.status_code == 200 and not (set(all_queue_ids) & ids),
            resp,
        )

    # ---------------------------------------------------------------
    # 10. ADMIN TESTS (CRUD đề thi / câu hỏi + thống kê lượt làm)
    # ---------------------------------------------------------------
    def test_admin_tests(self):
        print(f"\n{Colors.BOLD}=== 10. ADMIN TESTS (/admin/tests) ==={Colors.END}")
        admin_token = self.state.get("admin_access_token")
        student_token = self.state.get("student_access_token")
        if not admin_token:
            self.skip("Admin tests", "Không có admin token")
            return

        base = "/admin/tests"
        set_payload = {"exam_type": "IELTS", "section": "Reading", "title": "[TEST-ADMIN] Đề thử", "time_limit_minutes": 60}

        # 10.1 Xác thực & phân quyền
        resp, err = self.request("POST", f"{base}/test-sets", json=set_payload)
        self.check("POST /admin/tests/test-sets (không token -> 401)", resp is not None and resp.status_code == 401, resp)
        if student_token:
            for method, path, body in [
                ("POST", "/test-sets", set_payload),
                ("PUT", "/questions/1", {"question_text": "x"}),
                ("GET", "/attempts?test_set_id=1", None),
            ]:
                resp, err = self.request(method, f"{base}{path}", token=student_token, json=body)
                self.check(f"{method} /admin/tests{path.split('?')[0]} (student -> 403)", resp is not None and resp.status_code == 403, resp)
        else:
            self.skip("Admin tests (student -> 403)", "Không có student token")

        # 10.2 Validation đề thi
        for label, body in [
            ("thiếu field", {}),
            ("exam_type sai", {**set_payload, "exam_type": "GRE"}),
            ("time_limit_minutes = 0", {**set_payload, "time_limit_minutes": 0}),
            ("time_limit_minutes là chuỗi", {**set_payload, "time_limit_minutes": "60"}),
        ]:
            resp, err = self.request("POST", f"{base}/test-sets", token=admin_token, json=body)
            self.check(f"POST /admin/tests/test-sets ({label} -> 400)", resp is not None and resp.status_code == 400, resp)

        # 10.3 Tạo đề
        resp, err = self.request("POST", f"{base}/test-sets", token=admin_token, json=set_payload)
        created = self._data(resp) if resp is not None else None
        ok = self.check(
            "POST /admin/tests/test-sets (-> 201, data = test_set)",
            resp is not None and resp.status_code == 201 and isinstance(created, dict)
            and created.get("id") and created.get("title") == set_payload["title"]
            and created.get("exam_type") == "IELTS" and created.get("time_limit_minutes") == 60,
            resp,
        )
        if not ok:
            self.skip("Các test admin tests còn lại", "Không tạo được đề thi")
            return

        set_id = created["id"]
        question_ids = []
        try:
            self._admin_tests_scenarios(base, admin_token, set_id, question_ids)
        finally:
            _, cerr = self._run_fixture("cleanup", {"test_set_id": set_id, "question_ids": question_ids}, script="admin_tests_fixtures.js")
            if cerr:
                print(f"{Colors.YELLOW}⚠️  Không dọn được dữ liệu thử: {cerr}{Colors.END}")

    def _admin_tests_scenarios(self, base, admin_token, set_id, question_ids):
        # --- PUT đề ---
        resp, err = self.request("PUT", f"{base}/test-sets/{set_id}", token=admin_token, json={"title": "[TEST-ADMIN] Đề đã sửa"})
        data = self._data(resp) if resp is not None else None
        self.check(
            "PUT /admin/tests/test-sets/:id (sửa từng phần -> 200, field khác giữ nguyên)",
            resp is not None and resp.status_code == 200 and isinstance(data, dict)
            and data.get("title") == "[TEST-ADMIN] Đề đã sửa" and data.get("exam_type") == "IELTS"
            and data.get("time_limit_minutes") == 60,
            resp,
        )
        resp, err = self.request("PUT", f"{base}/test-sets/{set_id}", token=admin_token, json={})
        self.check("PUT /admin/tests/test-sets/:id (body rỗng -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("PUT", f"{base}/test-sets/99999999", token=admin_token, json={"title": "x"})
        self.check("PUT /admin/tests/test-sets/99999999 (-> 404)", resp is not None and resp.status_code == 404, resp)

        # --- POST câu hỏi ---
        mc = {
            "test_set_id": set_id, "question_text": "2 + 2 = ?", "question_type": "multiple_choice",
            "options": ["A. 3", "B. 4", "C. 5", "D. 6"], "correct_answer": "B", "order_index": 1,
        }
        for label, body in [
            ("multiple_choice thiếu options", {k: v for k, v in mc.items() if k != "options"}),
            ("fill_blank thiếu correct_answer", {"test_set_id": set_id, "question_text": "q", "question_type": "fill_blank"}),
            ("question_type sai", {**mc, "question_type": "true_false"}),
            ("order_index âm", {**mc, "order_index": -1}),
        ]:
            resp, err = self.request("POST", f"{base}/questions", token=admin_token, json=body)
            self.check(f"POST /admin/tests/questions ({label} -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("POST", f"{base}/questions", token=admin_token, json={**mc, "test_set_id": 99999999})
        self.check("POST /admin/tests/questions (test_set_id không tồn tại -> 404)", resp is not None and resp.status_code == 404, resp)

        resp, err = self.request("POST", f"{base}/questions", token=admin_token, json=mc)
        q = self._data(resp) if resp is not None else None
        ok = self.check(
            "POST /admin/tests/questions (multiple_choice -> 201, data = question)",
            resp is not None and resp.status_code == 201 and isinstance(q, dict) and q.get("id")
            and q.get("test_set_id") == set_id and q.get("options") == mc["options"]
            and q.get("correct_answer") == "B" and q.get("order_index") == 1,
            resp,
        )
        if not ok:
            return
        question_ids.append(q["id"])

        resp, err = self.request(
            "POST", f"{base}/questions", token=admin_token,
            json={"test_set_id": set_id, "question_text": "Write about your hometown", "question_type": "essay"},
        )
        essay = self._data(resp) if resp is not None else None
        ok = self.check(
            "POST /admin/tests/questions (essay không cần options/correct_answer -> 201)",
            resp is not None and resp.status_code == 201 and isinstance(essay, dict)
            and essay.get("options") is None and essay.get("correct_answer") is None and essay.get("order_index") == 0,
            resp,
        )
        if ok:
            question_ids.append(essay["id"])

        # --- PUT câu hỏi ---
        resp, err = self.request("PUT", f"{base}/questions/{q['id']}", token=admin_token, json={"question_text": "3 + 3 = ?", "correct_answer": "D"})
        data = self._data(resp) if resp is not None else None
        self.check(
            "PUT /admin/tests/questions/:id (sửa từng phần -> 200, options giữ nguyên)",
            resp is not None and resp.status_code == 200 and isinstance(data, dict)
            and data.get("question_text") == "3 + 3 = ?" and data.get("correct_answer") == "D"
            and data.get("options") == mc["options"],
            resp,
        )
        if ok:
            resp, err = self.request("PUT", f"{base}/questions/{essay['id']}", token=admin_token, json={"question_type": "multiple_choice"})
            self.check(
                "PUT /admin/tests/questions/:id (đổi essay -> multiple_choice mà thiếu options -> 400)",
                resp is not None and resp.status_code == 400, resp,
            )
        resp, err = self.request("PUT", f"{base}/questions/99999999", token=admin_token, json={"question_text": "x"})
        self.check("PUT /admin/tests/questions/99999999 (-> 404)", resp is not None and resp.status_code == 404, resp)

        # --- GET /attempts ---
        resp, err = self.request("GET", f"{base}/attempts", token=admin_token)
        self.check("GET /admin/tests/attempts (thiếu test_set_id -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("GET", f"{base}/attempts", token=admin_token, params={"test_set_id": "abc"})
        self.check("GET /admin/tests/attempts?test_set_id=abc (-> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("GET", f"{base}/attempts", token=admin_token, params={"test_set_id": 99999999})
        self.check("GET /admin/tests/attempts?test_set_id=99999999 (-> 404)", resp is not None and resp.status_code == 404, resp)

        resp, err = self.request("GET", f"{base}/attempts", token=admin_token, params={"test_set_id": set_id})
        data = self._data(resp) if resp is not None else None
        self.check(
            "GET /admin/tests/attempts (đề chưa có lượt làm -> attempts=[], completion_rate=0)",
            resp is not None and resp.status_code == 200 and isinstance(data, dict)
            and data.get("attempts") == [] and data.get("completion_rate") == 0,
            resp,
        )

        seeded, serr = self._run_fixture("seed_attempts", {"test_set_id": set_id}, script="admin_tests_fixtures.js")
        if not seeded:
            self.skip("Thống kê lượt làm bài / xoá đề có lượt làm", f"Không tạo được lượt làm thử ({serr})")
        else:
            resp, err = self.request("GET", f"{base}/attempts", token=admin_token, params={"test_set_id": set_id})
            data = self._data(resp) if resp is not None else None
            attempts = data.get("attempts", []) if isinstance(data, dict) else []
            shape_ok = len(attempts) == 3 and all(set(a.keys()) == {"user_id", "score", "band_score", "status"} for a in attempts)
            submitted = sorted((a["score"], a["band_score"]) for a in attempts if a["status"] == "submitted")
            self.check(
                "GET /admin/tests/attempts (3 lượt: shape đúng, điểm dạng số, completion_rate=66.67)",
                resp is not None and resp.status_code == 200 and shape_ok
                and submitted == [(60, 5.5), (80, 7)] and data.get("completion_rate") == 66.67
                and sum(1 for a in attempts if a["status"] == "in_progress") == 1,
                resp,
            )

            resp, err = self.request("DELETE", f"{base}/test-sets/{set_id}", token=admin_token)
            self.check("DELETE /admin/tests/test-sets/:id (đề đã có lượt làm -> 409)", resp is not None and resp.status_code == 409, resp)

            # dọn lượt làm thử để có thể xoá đề ở bước tiếp theo
            self._run_fixture("delete_attempts", {"test_set_id": set_id}, script="admin_tests_fixtures.js")

        # --- DELETE câu hỏi ---
        resp, err = self.request("DELETE", f"{base}/questions/{q['id']}", token=admin_token)
        data = self._data(resp) if resp is not None else None
        self.check(
            "DELETE /admin/tests/questions/:id (-> 200, data = question đã xoá)",
            resp is not None and resp.status_code == 200 and isinstance(data, dict) and data.get("id") == q["id"],
            resp,
        )
        resp, err = self.request("DELETE", f"{base}/questions/{q['id']}", token=admin_token)
        self.check("DELETE /admin/tests/questions/:id (xoá lại -> 404)", resp is not None and resp.status_code == 404, resp)

        # --- DELETE đề (câu hỏi essay còn lại phải bị xoá theo) ---
        if not seeded:
            return
        resp, err = self.request("DELETE", f"{base}/test-sets/{set_id}", token=admin_token)
        data = self._data(resp) if resp is not None else None
        self.check(
            "DELETE /admin/tests/test-sets/:id (-> 200, data = test_set đã xoá)",
            resp is not None and resp.status_code == 200 and isinstance(data, dict) and data.get("id") == set_id,
            resp,
        )
        resp, err = self.request("DELETE", f"{base}/test-sets/{set_id}", token=admin_token)
        self.check("DELETE /admin/tests/test-sets/:id (xoá lại -> 404)", resp is not None and resp.status_code == 404, resp)
        if ok:
            resp, err = self.request("PUT", f"{base}/questions/{essay['id']}", token=admin_token, json={"question_text": "x"})
            self.check("Câu hỏi của đề đã xoá bị xoá theo (CASCADE -> 404)", resp is not None and resp.status_code == 404, resp)

    # ---------------------------------------------------------------
    # 11. ADMIN LOGS (log lỗi giữa các service + audit log)
    # ---------------------------------------------------------------
    def test_admin_logs(self):
        print(f"\n{Colors.BOLD}=== 11. ADMIN LOGS (/admin/logs) ==={Colors.END}")
        admin_token = self.state.get("admin_access_token")
        student_token = self.state.get("student_access_token")
        if not admin_token:
            self.skip("Admin logs tests", "Không có admin token")
            return

        base = "/admin/logs"

        # 11.1 Không có token -> 401, student -> 403
        for ep in ("errors", "audit"):
            resp, err = self.request("GET", f"{base}/{ep}")
            self.check(f"GET /admin/logs/{ep} (không token -> 401)", resp is not None and resp.status_code == 401, resp)
            if student_token:
                resp, err = self.request("GET", f"{base}/{ep}", token=student_token)
                self.check(f"GET /admin/logs/{ep} (student -> 403)", resp is not None and resp.status_code == 403, resp)
            else:
                self.skip(f"GET /admin/logs/{ep} (student -> 403)", "Không có student token")

        # 11.2 Validation không cần dữ liệu thử
        bad_queries = [
            ("errors", {"service": "invalid"}, "service sai"),
            ("errors", {"from": "abc"}, "from sai định dạng"),
            ("errors", {"to": "2026-02-30"}, "to là ngày không tồn tại"),
            ("errors", {"from": "2026-09-05", "to": "2026-09-01"}, "from > to"),
            ("audit", {"actor_id": "abc"}, "actor_id không phải số"),
            ("audit", {"actor_id": "0"}, "actor_id = 0"),
            ("audit", {"action": "a" * 101}, "action > 100 ký tự"),
        ]
        for ep, params, label in bad_queries:
            resp, err = self.request("GET", f"{base}/{ep}", token=admin_token, params=params)
            self.check(f"GET /admin/logs/{ep} ({label} -> 400)", resp is not None and resp.status_code == 400, resp)

        # 11.3 Response tổng quát (dữ liệu thật hoặc rỗng đều hợp lệ)
        resp, err = self.request("GET", f"{base}/errors", token=admin_token)
        data = self._data(resp) if resp is not None else None
        self.check(
            "GET /admin/logs/errors (admin -> 200, data = {logs: [...]})",
            resp is not None and resp.status_code == 200 and isinstance(data, dict) and isinstance(data.get("logs"), list),
            resp,
        )
        resp, err = self.request("GET", f"{base}/audit", token=admin_token)
        data = self._data(resp) if resp is not None else None
        self.check(
            "GET /admin/logs/audit (admin -> 200, data = {logs: [...]})",
            resp is not None and resp.status_code == 200 and isinstance(data, dict) and isinstance(data.get("logs"), list),
            resp,
        )

        # 11.4 Các kịch bản lọc cần dữ liệu thử (tạo thẳng vào DB qua helper Node)
        fixture, ferr = self._run_fixture("create", script="logs_fixtures.js")
        if not fixture:
            self.skip(
                "Kịch bản lọc log lỗi / audit log",
                f"Không tạo được dữ liệu thử ({ferr}). Cần 'node' trong PATH, .env trỏ đúng DB, đã chạy 'npm run migrate' và 'npm run db:seed'.",
            )
            return

        try:
            self._logs_scenarios(base, admin_token, fixture)
        finally:
            _, cerr = self._run_fixture("cleanup", fixture, script="logs_fixtures.js")
            if cerr:
                print(f"{Colors.YELLOW}⚠️  Không dọn được dữ liệu thử: {cerr}{Colors.END}")

    def _logs_scenarios(self, base, admin_token, fixture):
        tag, suffix = fixture["tag"], fixture["suffix"]
        window = {"from": "2001-01-01", "to": "2001-12-31"}  # log thử nằm hết trong tháng 1/2001

        def ours(resp):
            data = self._data(resp) or {}
            logs = data.get("logs", []) if isinstance(data, dict) else []
            return [l for l in logs if tag in str(l.get("message", "")) and suffix in str(l.get("message", ""))]

        def get_errors(**params):
            return self.request("GET", f"{base}/errors", token=admin_token, params=params)

        # --- GET /errors ---
        resp, err = get_errors(**window)
        rows = ours(resp) if resp is not None else []
        self.check(
            "GET /admin/logs/errors?from&to (-> 200, có đủ 4 log thử)",
            resp is not None and resp.status_code == 200 and len(rows) == 4,
            resp,
        )
        all_rows = (self._data(resp) or {}).get("logs", []) if resp is not None else []
        shape_ok = bool(all_rows) and all(set(l.keys()) == {"service", "level", "message", "created_at"} for l in all_rows)
        self._check_db("GET /admin/logs/errors — mỗi log đúng 4 field {service, level, message, created_at}, không lộ stack_trace", shape_ok)
        dates = [l.get("created_at") for l in rows]
        self._check_db("GET /admin/logs/errors — sắp xếp mới nhất trước", dates == sorted(dates, reverse=True) and len(dates) == 4)

        for svc, expected in (("backend", 2), ("ml-service", 2)):
            resp, err = get_errors(service=svc, **window)
            rows = ours(resp) if resp is not None else []
            all_rows = (self._data(resp) or {}).get("logs", []) if resp is not None else []
            self.check(
                f"GET /admin/logs/errors?service={svc} (chỉ log của {svc})",
                resp is not None and resp.status_code == 200 and len(rows) == expected
                and all(l.get("service") == svc for l in all_rows),
                resp,
            )

        # from/to dạng ngày bao trọn cả ngày cuối: 15/01 và 20/01 (đều lúc 10:00 UTC) đều nằm trong khoảng
        resp, err = get_errors(**{"from": "2001-01-15", "to": "2001-01-20"})
        msgs = sorted(l["message"].split(" ")[1] for l in ours(resp)) if resp is not None and resp.status_code == 200 else []
        self.check(
            "GET /admin/logs/errors?from=2001-01-15&to=2001-01-20 (bao trọn ngày cuối -> backend-2, ml-1)",
            resp is not None and msgs == ["backend-2", "ml-1"],
            resp,
        )

        # ISO 8601 đầy đủ: 09:00Z ngày 20/01 loại log 10:00Z cùng ngày
        resp, err = get_errors(**{"from": "2001-01-15T00:00:00Z", "to": "2001-01-20T09:00:00Z"})
        msgs = sorted(l["message"].split(" ")[1] for l in ours(resp)) if resp is not None and resp.status_code == 200 else []
        self.check(
            "GET /admin/logs/errors?to=2001-01-20T09:00:00Z (ISO 8601 -> chỉ backend-2)",
            resp is not None and msgs == ["backend-2"],
            resp,
        )

        resp, err = get_errors(service="backend", **{"from": "2001-01-12", "to": "2001-01-31"})
        msgs = [l["message"].split(" ")[1] for l in ours(resp)] if resp is not None and resp.status_code == 200 else []
        self.check(
            "GET /admin/logs/errors?service=backend&from&to (kết hợp bộ lọc -> chỉ backend-2)",
            resp is not None and msgs == ["backend-2"],
            resp,
        )

        resp, err = get_errors(**{"from": "1990-01-01", "to": "1990-12-31"})
        self.check(
            "GET /admin/logs/errors (khoảng thời gian không có log -> logs = [])",
            resp is not None and resp.status_code == 200 and (self._data(resp) or {}).get("logs") == [],
            resp,
        )

        # --- GET /audit ---
        def get_audit(**params):
            return self.request("GET", f"{base}/audit", token=admin_token, params=params)

        resp, err = get_audit(action=fixture["action_alpha"])
        logs = (self._data(resp) or {}).get("logs", []) if resp is not None else []
        self.check(
            "GET /admin/logs/audit?action= (-> 200, 2 log của admin, khớp chính xác action)",
            resp is not None and resp.status_code == 200 and len(logs) == 2
            and all(l.get("actor_id") == fixture["admin_id"] and l.get("action") == fixture["action_alpha"] for l in logs),
            resp,
        )
        shape_ok = bool(logs) and all(set(l.keys()) == {"actor_id", "action", "target_type", "target_id", "created_at"} for l in logs)
        self._check_db("GET /admin/logs/audit — mỗi log đúng 5 field {actor_id, action, target_type, target_id, created_at}, không lộ detail", shape_ok)
        self._check_db(
            "GET /admin/logs/audit — sắp xếp mới nhất trước (target_id 1002 rồi 1001)",
            [l.get("target_id") for l in logs] == [1002, 1001],
        )

        resp, err = get_audit(actor_id=fixture["student_id"], action=fixture["action_beta"])
        logs = (self._data(resp) or {}).get("logs", []) if resp is not None else []
        self.check(
            "GET /admin/logs/audit?actor_id=&action= (kết hợp -> 1 log của student)",
            resp is not None and resp.status_code == 200 and len(logs) == 1 and logs[0].get("target_id") == 1003,
            resp,
        )

        # action đúng nhưng actor khác -> rỗng
        resp, err = get_audit(actor_id=fixture["student_id"], action=fixture["action_alpha"])
        self.check(
            "GET /admin/logs/audit (action của admin nhưng actor_id = student -> logs = [])",
            resp is not None and resp.status_code == 200 and (self._data(resp) or {}).get("logs") == [],
            resp,
        )

        # actor_id lọc đúng người: mọi log trả về đều thuộc admin
        resp, err = get_audit(actor_id=fixture["admin_id"])
        logs = (self._data(resp) or {}).get("logs", []) if resp is not None else []
        self.check(
            "GET /admin/logs/audit?actor_id= (chỉ log của actor đó)",
            resp is not None and resp.status_code == 200 and len(logs) >= 2
            and all(l.get("actor_id") == fixture["admin_id"] for l in logs),
            resp,
        )

    # ---------------------------------------------------------------
    # 12-14. ADMIN DASHBOARD MODULE (mẫu thông báo / tổng quan / gói cước)
    # ---------------------------------------------------------------
    def test_admin_dashboard_module(self):
        admin_token = self.state.get("admin_access_token")
        student_token = self.state.get("student_access_token")
        if not admin_token:
            print(f"\n{Colors.BOLD}=== 12-14. ADMIN DASHBOARD MODULE ==={Colors.END}")
            self.skip("Admin dashboard module tests", "Không có admin token")
            return

        script = "dashboard_fixtures.js"
        tag = "[TEST-DASH]"
        self.state["dash_created"] = {"template_ids": [], "plan_ids": []}  # để dọn audit log sau khi test xong

        # Các kịch bản không cần dữ liệu thử chạy trước; baseline overview phải lấy TRƯỚC khi tạo dữ liệu thử.
        self._notifications_basics(admin_token, student_token, tag)
        baseline = self._dashboard_basics(admin_token, student_token)
        self._subscriptions_basics(admin_token, student_token, tag)

        fixture, ferr = self._run_fixture("create", script=script)
        if not fixture:
            self.skip(
                "Kịch bản dùng dữ liệu thử (sent-history / overview / đăng ký gói)",
                f"Không tạo được dữ liệu thử ({ferr}). Cần 'node' trong PATH, .env trỏ đúng DB, đã chạy 'npm run migrate' và 'npm run db:seed'.",
            )
            self._run_fixture("cleanup", dict(self.state["dash_created"]), script=script)  # dọn phần còn sót
            return

        print(f"\n{Colors.BOLD}--- 12-14 (tiếp): kịch bản dùng dữ liệu thử ---{Colors.END}")
        try:
            self._sent_history_scenarios(admin_token, fixture)
            self._dashboard_scenarios(admin_token, fixture, baseline, script)
            self._subscriptions_scenarios(admin_token, fixture)
        finally:
            _, cerr = self._run_fixture("cleanup", {**fixture, **self.state["dash_created"]}, script=script)
            if cerr:
                print(f"{Colors.YELLOW}⚠️  Không dọn được dữ liệu thử: {cerr}{Colors.END}")

    def _dash_created(self, key, value):
        """Ghi nhớ id mẫu/gói do test tạo qua API (đã xoá bằng API nhưng audit log của chúng cần được dọn)."""
        self.state.setdefault("dash_created", {"template_ids": [], "plan_ids": []})[key].append(value)

    # ----- 12. NOTIFICATIONS (không cần dữ liệu thử) -----
    def _notifications_basics(self, admin_token, student_token, tag):
        print(f"\n{Colors.BOLD}=== 12. ADMIN NOTIFICATIONS (/admin/notifications) ==={Colors.END}")
        base = "/admin/notifications"
        tpl_keys = {"id", "name", "title_template", "body_template", "type", "created_at"}

        endpoints = [
            ("POST", f"{base}/templates", {"json": {"name": "x", "title_template": "t", "body_template": "b", "type": "system"}}),
            ("PUT", f"{base}/templates/1", {"json": {"type": "system"}}),
            ("DELETE", f"{base}/templates/1", {}),
            ("GET", f"{base}/sent-history", {}),
        ]
        for method, path, kw in endpoints:
            resp, err = self.request(method, path, **kw)
            self.check(f"{method} {path} (không token -> 401)", resp is not None and resp.status_code == 401, resp)
            if student_token:
                resp, err = self.request(method, path, token=student_token, **kw)
                self.check(f"{method} {path} (student -> 403)", resp is not None and resp.status_code == 403, resp)
            else:
                self.skip(f"{method} {path} (student -> 403)", "Không có student token")

        # Validation
        good = {"name": f"{tag} welcome {RANDOM_SUFFIX}", "title_template": "Hi {{name}}", "body_template": "Body", "type": "system"}
        bad_bodies = [
            ({}, "body rỗng"),
            ({**good, "name": ""}, "name rỗng"),
            ({**good, "type": "Bad Type"}, "type sai định dạng"),
            ({**good, "title_template": "a" * 256}, "title_template > 255 ký tự"),
        ]
        for body, label in bad_bodies:
            resp, err = self.request("POST", f"{base}/templates", token=admin_token, json=body)
            self.check(f"POST /admin/notifications/templates ({label} -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("PUT", f"{base}/templates/abc", token=admin_token, json={"type": "x"})
        self.check("PUT /admin/notifications/templates/abc (id sai -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("PUT", f"{base}/templates/99999999", token=admin_token, json={"type": "x"})
        self.check("PUT /admin/notifications/templates/99999999 (-> 404)", resp is not None and resp.status_code == 404, resp)
        resp, err = self.request("DELETE", f"{base}/templates/99999999", token=admin_token)
        self.check("DELETE /admin/notifications/templates/99999999 (-> 404)", resp is not None and resp.status_code == 404, resp)

        # CRUD
        resp, err = self.request("POST", f"{base}/templates", token=admin_token, json=good)
        data = self._data(resp) if resp is not None else None
        created = resp is not None and resp.status_code == 201 and isinstance(data, dict) and set(data.keys()) == tpl_keys and data.get("name") == good["name"]
        self.check("POST /admin/notifications/templates (-> 201, data = template)", created, resp)
        if not created:
            return
        tid = data["id"]
        self._dash_created("template_ids", tid)

        resp, err = self.request("POST", f"{base}/templates", token=admin_token, json=good)
        self.check("POST /admin/notifications/templates (trùng tên -> 409)", resp is not None and resp.status_code == 409, resp)

        resp, err = self.request("PUT", f"{base}/templates/{tid}", token=admin_token, json={"title_template": "Updated {{name}}", "type": "review_due"})
        data = self._data(resp) if resp is not None else None
        self.check(
            "PUT /admin/notifications/templates/:id (-> 200, data = template sau khi sửa, field không gửi giữ nguyên)",
            resp is not None and resp.status_code == 200 and isinstance(data, dict)
            and data.get("title_template") == "Updated {{name}}" and data.get("type") == "review_due" and data.get("body_template") == "Body",
            resp,
        )
        resp, err = self.request("PUT", f"{base}/templates/{tid}", token=admin_token, json={})
        self.check("PUT /admin/notifications/templates/:id (body rỗng -> 400)", resp is not None and resp.status_code == 400, resp)

        other = {**good, "name": f"{tag} other {RANDOM_SUFFIX}"}
        resp, err = self.request("POST", f"{base}/templates", token=admin_token, json=other)
        other_data = self._data(resp) if resp is not None else None
        if resp is not None and resp.status_code == 201 and other_data:
            self._dash_created("template_ids", other_data["id"])
            resp, err = self.request("PUT", f"{base}/templates/{other_data['id']}", token=admin_token, json={"name": good["name"]})
            self.check("PUT /admin/notifications/templates/:id (đổi sang tên đã có -> 409)", resp is not None and resp.status_code == 409, resp)
            self.request("DELETE", f"{base}/templates/{other_data['id']}", token=admin_token)

        resp, err = self.request("DELETE", f"{base}/templates/{tid}", token=admin_token)
        data = self._data(resp) if resp is not None else None
        self.check(
            "DELETE /admin/notifications/templates/:id (-> 200, data = template vừa xoá)",
            resp is not None and resp.status_code == 200 and isinstance(data, dict) and data.get("id") == tid,
            resp,
        )
        resp, err = self.request("DELETE", f"{base}/templates/{tid}", token=admin_token)
        self.check("DELETE /admin/notifications/templates/:id (xoá lại -> 404)", resp is not None and resp.status_code == 404, resp)

        # sent-history validation
        for params, label in [({"from": "abc"}, "from sai định dạng"), ({"to": "2026-02-30"}, "to là ngày không tồn tại"),
                              ({"from": "2026-09-05", "to": "2026-09-01"}, "from > to")]:
            resp, err = self.request("GET", f"{base}/sent-history", token=admin_token, params=params)
            self.check(f"GET /admin/notifications/sent-history ({label} -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("GET", f"{base}/sent-history", token=admin_token)
        data = self._data(resp) if resp is not None else None
        self.check(
            "GET /admin/notifications/sent-history (admin -> 200, data = {history: [...]})",
            resp is not None and resp.status_code == 200 and isinstance(data, dict) and isinstance(data.get("history"), list),
            resp,
        )

    # ----- 13. DASHBOARD (phần không cần dữ liệu thử) -----
    def _dashboard_basics(self, admin_token, student_token):
        print(f"\n{Colors.BOLD}=== 13. ADMIN DASHBOARD (/admin/dashboard) ==={Colors.END}")
        path = "/admin/dashboard/overview"

        resp, err = self.request("GET", path)
        self.check("GET /admin/dashboard/overview (không token -> 401)", resp is not None and resp.status_code == 401, resp)
        if student_token:
            resp, err = self.request("GET", path, token=student_token)
            self.check("GET /admin/dashboard/overview (student -> 403)", resp is not None and resp.status_code == 403, resp)
        else:
            self.skip("GET /admin/dashboard/overview (student -> 403)", "Không có student token")

        resp, err = self.request("GET", path, token=admin_token)
        data = self._data(resp) if resp is not None else None
        keys_ok = isinstance(data, dict) and set(data.keys()) == {"total_users", "daily_active_users", "completion_rate", "recent_errors"}
        self.check("GET /admin/dashboard/overview (admin -> 200, đúng 4 field)", resp is not None and resp.status_code == 200 and keys_ok, resp)
        if not keys_ok:
            return None

        types_ok = (
            isinstance(data["total_users"], int) and data["total_users"] >= 3
            and isinstance(data["daily_active_users"], int) and 0 <= data["daily_active_users"] <= data["total_users"]
            and isinstance(data["completion_rate"], (int, float)) and 0 <= data["completion_rate"] <= 100
            and isinstance(data["recent_errors"], list) and len(data["recent_errors"]) <= 10
        )
        self._check_db("GET /admin/dashboard/overview — kiểu dữ liệu & miền giá trị hợp lệ", types_ok)
        errs = data["recent_errors"]
        shape_ok = all(set(e.keys()) == {"service", "level", "message", "created_at"} and e["level"] in ("error", "critical") for e in errs)
        self._check_db("GET /admin/dashboard/overview — recent_errors đúng 4 field, chỉ mức error/critical", shape_ok)
        return data

    # ----- 14. SUBSCRIPTIONS (phần không cần dữ liệu thử) -----
    def _subscriptions_basics(self, admin_token, student_token, tag):
        print(f"\n{Colors.BOLD}=== 14. ADMIN SUBSCRIPTIONS (/admin/subscriptions) ==={Colors.END}")
        base = "/admin/subscriptions"
        plan_keys = {"id", "name", "price", "duration_days", "features", "created_at"}

        endpoints = [
            ("POST", f"{base}/plans", {"json": {"name": "x", "price": 1, "duration_days": 1}}),
            ("PUT", f"{base}/plans/1", {"json": {"name": "x"}}),
            ("DELETE", f"{base}/plans/1", {}),
            ("GET", base, {}),
        ]
        for method, path, kw in endpoints:
            resp, err = self.request(method, path, **kw)
            self.check(f"{method} {path} (không token -> 401)", resp is not None and resp.status_code == 401, resp)
            if student_token:
                resp, err = self.request(method, path, token=student_token, **kw)
                self.check(f"{method} {path} (student -> 403)", resp is not None and resp.status_code == 403, resp)
            else:
                self.skip(f"{method} {path} (student -> 403)", "Không có student token")

        good = {"name": f"{tag} Plan {RANDOM_SUFFIX}", "price": 199000, "duration_days": 30, "features": ["no ads", "offline"]}
        bad_bodies = [
            ({}, "body rỗng"),
            ({**good, "price": -1}, "price âm"),
            ({**good, "price": "100"}, "price là chuỗi"),
            ({**good, "price": 1.234}, "price > 2 chữ số thập phân"),
            ({**good, "duration_days": 0}, "duration_days = 0"),
            ({**good, "features": "text"}, "features là chuỗi"),
        ]
        for body, label in bad_bodies:
            resp, err = self.request("POST", f"{base}/plans", token=admin_token, json=body)
            self.check(f"POST /admin/subscriptions/plans ({label} -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("PUT", f"{base}/plans/99999999", token=admin_token, json={"name": "x"})
        self.check("PUT /admin/subscriptions/plans/99999999 (-> 404)", resp is not None and resp.status_code == 404, resp)
        resp, err = self.request("DELETE", f"{base}/plans/99999999", token=admin_token)
        self.check("DELETE /admin/subscriptions/plans/99999999 (-> 404)", resp is not None and resp.status_code == 404, resp)

        for params, label in [({"user_id": "abc"}, "user_id không phải số"), ({"status": "foo"}, "status sai")]:
            resp, err = self.request("GET", base, token=admin_token, params=params)
            self.check(f"GET /admin/subscriptions ({label} -> 400)", resp is not None and resp.status_code == 400, resp)
        resp, err = self.request("GET", base, token=admin_token)
        data = self._data(resp) if resp is not None else None
        self.check(
            "GET /admin/subscriptions (admin -> 200, data = {subscriptions: [...]})",
            resp is not None and resp.status_code == 200 and isinstance(data, dict) and isinstance(data.get("subscriptions"), list),
            resp,
        )

        # CRUD gói cước
        resp, err = self.request("POST", f"{base}/plans", token=admin_token, json=good)
        data = self._data(resp) if resp is not None else None
        created = (
            resp is not None and resp.status_code == 201 and isinstance(data, dict) and set(data.keys()) == plan_keys
            and data.get("price") == 199000 and isinstance(data.get("price"), (int, float)) and data.get("features") == good["features"]
        )
        self.check("POST /admin/subscriptions/plans (-> 201, data = plan, price là số)", created, resp)
        if not created:
            return
        pid = data["id"]
        self._dash_created("plan_ids", pid)

        resp, err = self.request("PUT", f"{base}/plans/{pid}", token=admin_token, json={"price": 249000.5, "features": None})
        data = self._data(resp) if resp is not None else None
        self.check(
            "PUT /admin/subscriptions/plans/:id (-> 200, data = plan sau khi sửa)",
            resp is not None and resp.status_code == 200 and isinstance(data, dict)
            and data.get("price") == 249000.5 and data.get("features") is None and data.get("duration_days") == 30,
            resp,
        )
        resp, err = self.request("PUT", f"{base}/plans/{pid}", token=admin_token, json={})
        self.check("PUT /admin/subscriptions/plans/:id (body rỗng -> 400)", resp is not None and resp.status_code == 400, resp)

        resp, err = self.request("DELETE", f"{base}/plans/{pid}", token=admin_token)
        data = self._data(resp) if resp is not None else None
        self.check(
            "DELETE /admin/subscriptions/plans/:id (-> 200, data = plan vừa xoá)",
            resp is not None and resp.status_code == 200 and isinstance(data, dict) and data.get("id") == pid,
            resp,
        )
        resp, err = self.request("DELETE", f"{base}/plans/{pid}", token=admin_token)
        self.check("DELETE /admin/subscriptions/plans/:id (xoá lại -> 404)", resp is not None and resp.status_code == 404, resp)

    # ----- 12 (tiếp): sent-history với dữ liệu thử -----
    def _sent_history_scenarios(self, admin_token, fixture):
        path = "/admin/notifications/sent-history"
        tag, suffix = fixture["tag"], fixture["suffix"]
        window = {"from": "2001-01-01", "to": "2001-12-31"}

        def ours(resp):
            data = self._data(resp) or {}
            rows = data.get("history", []) if isinstance(data, dict) else []
            return [r for r in rows if tag in str(r.get("title", "")) and suffix in str(r.get("title", ""))]

        resp, err = self.request("GET", path, token=admin_token, params=window)
        rows = ours(resp) if resp is not None else []
        self.check("GET /admin/notifications/sent-history?from&to (-> 200, có đủ 3 thông báo thử)", resp is not None and resp.status_code == 200 and len(rows) == 3, resp)
        all_rows = (self._data(resp) or {}).get("history", []) if resp is not None else []
        keys = {"id", "user_id", "title", "body", "type", "is_read", "created_at"}
        self._check_db(
            "GET /admin/notifications/sent-history — mỗi dòng đúng 7 field, user_id là số, is_read là boolean",
            bool(all_rows) and all(set(r.keys()) == keys and isinstance(r["user_id"], int) and isinstance(r["is_read"], bool) for r in all_rows),
        )
        dates = [r["created_at"] for r in rows]
        self._check_db("GET /admin/notifications/sent-history — sắp xếp mới nhất trước", dates == sorted(dates, reverse=True) and len(dates) == 3)
        self._check_db("GET /admin/notifications/sent-history — user_id đúng người nhận", all(r["user_id"] == fixture["user_id"] for r in rows))

        resp, err = self.request("GET", path, token=admin_token, params={"from": "2001-01-15", "to": "2001-01-20"})
        n = len(ours(resp)) if resp is not None and resp.status_code == 200 else -1
        self.check("GET /admin/notifications/sent-history?from=2001-01-15&to=2001-01-20 (bao trọn ngày cuối -> 2 thông báo)", n == 2, resp)

        resp, err = self.request("GET", path, token=admin_token, params={"from": "2001-01-11T00:00:00Z", "to": "2001-01-15T09:00:00Z"})
        n = len(ours(resp)) if resp is not None and resp.status_code == 200 else -1
        self.check("GET /admin/notifications/sent-history (ISO 8601 -> 0 thông báo)", n == 0, resp)

        resp, err = self.request("GET", path, token=admin_token, params={"from": "1990-01-01", "to": "1990-12-31"})
        self.check(
            "GET /admin/notifications/sent-history (khoảng không có dữ liệu -> history = [])",
            resp is not None and resp.status_code == 200 and (self._data(resp) or {}).get("history") == [],
            resp,
        )

    # ----- 13 (tiếp): overview đối chiếu với dữ liệu thử + SQL thuần -----
    def _dashboard_scenarios(self, admin_token, fixture, baseline, script):
        path = "/admin/dashboard/overview"
        resp, err = self.request("GET", path, token=admin_token)
        data = self._data(resp) if resp is not None else None
        if resp is None or resp.status_code != 200 or not isinstance(data, dict):
            self.check("GET /admin/dashboard/overview (sau khi có dữ liệu thử)", False, resp)
            return

        expected, eerr = self._run_fixture("expected", script=script)
        if expected:
            self.check(
                "GET /admin/dashboard/overview — total_users / daily_active_users / completion_rate khớp SQL thuần",
                data["total_users"] == expected["total_users"]
                and data["daily_active_users"] == expected["daily_active_users"]
                and abs(data["completion_rate"] - expected["completion_rate"]) < 0.005,
                resp,
                note=f"api={data['total_users']}/{data['daily_active_users']}/{data['completion_rate']} sql={expected['total_users']}/{expected['daily_active_users']}/{expected['completion_rate']}",
            )
        else:
            self.skip("Đối chiếu overview với SQL thuần", eerr)

        if baseline:
            self.check(
                "GET /admin/dashboard/overview — thêm 1 user và 1 lượt đọc hôm nay -> total_users +1, daily_active_users +1",
                data["total_users"] == baseline["total_users"] + 1 and data["daily_active_users"] == baseline["daily_active_users"] + 1,
                resp,
                note=f"trước={baseline['total_users']}/{baseline['daily_active_users']} sau={data['total_users']}/{data['daily_active_users']}",
            )
        errs = data["recent_errors"]
        self.check(
            "GET /admin/dashboard/overview — recent_errors: log critical mới nhất đứng đầu, log info bị loại, không lộ stack_trace",
            bool(errs) and errs[0]["message"] == fixture["critical_message"]
            and not any(e["message"] == fixture["info_message"] for e in errs)
            and all(set(e.keys()) == {"service", "level", "message", "created_at"} for e in errs),
            resp,
        )

    # ----- 14 (tiếp): đăng ký gói với dữ liệu thử -----
    def _subscriptions_scenarios(self, admin_token, fixture):
        base = "/admin/subscriptions"
        keys = {"id", "user_id", "plan_id", "status", "start_date", "end_date", "created_at"}

        def rows_of(resp):
            data = self._data(resp) or {}
            return data.get("subscriptions", []) if isinstance(data, dict) else []

        def ours(resp):
            return [s for s in rows_of(resp) if s.get("plan_id") == fixture["plan_id"]]

        resp, err = self.request("GET", base, token=admin_token, params={"user_id": fixture["user_id"]})
        rows = rows_of(resp) if resp is not None else []
        self.check(
            "GET /admin/subscriptions?user_id= (-> 200, chỉ đăng ký của user đó)",
            resp is not None and resp.status_code == 200 and len(rows) == 1 and rows[0]["user_id"] == fixture["user_id"] and rows[0]["status"] == "active",
            resp,
        )
        self._check_db(
            "GET /admin/subscriptions — mỗi dòng đúng 7 field, id dạng số, ngày dạng YYYY-MM-DD",
            bool(rows) and all(set(r.keys()) == keys and isinstance(r["user_id"], int) and isinstance(r["plan_id"], int)
                               and len(r["start_date"]) == 10 and len(r["end_date"]) == 10 for r in rows),
        )

        resp, err = self.request("GET", base, token=admin_token, params={"status": "expired"})
        mine = ours(resp) if resp is not None else []
        self.check(
            "GET /admin/subscriptions?status=expired (-> chỉ đăng ký hết hạn, có bản ghi thử)",
            resp is not None and resp.status_code == 200 and len(mine) == 1 and all(r["status"] == "expired" for r in rows_of(resp)),
            resp,
        )

        resp, err = self.request("GET", base, token=admin_token, params={"user_id": fixture["student1_id"], "status": "expired"})
        mine = ours(resp) if resp is not None else []
        self.check("GET /admin/subscriptions?user_id=&status= (kết hợp -> đúng 1 bản ghi thử)", resp is not None and resp.status_code == 200 and len(mine) == 1, resp)

        resp, err = self.request("GET", base, token=admin_token, params={"user_id": fixture["user_id"], "status": "cancelled"})
        self.check(
            "GET /admin/subscriptions (không có bản ghi khớp -> subscriptions = [])",
            resp is not None and resp.status_code == 200 and rows_of(resp) == [],
            resp,
        )

        # Gói đã có đăng ký không được xoá (tránh CASCADE xoá đăng ký của học viên), và phải còn nguyên.
        resp, err = self.request("DELETE", f"{base}/plans/{fixture['plan_id']}", token=admin_token)
        self.check("DELETE /admin/subscriptions/plans/:id (gói đã có đăng ký -> 409)", resp is not None and resp.status_code == 409, resp)
        resp, err = self.request("GET", base, token=admin_token, params={"user_id": fixture["user_id"]})
        self.check("Đăng ký vẫn còn nguyên sau khi xoá gói bị chặn", resp is not None and len(rows_of(resp)) == 1, resp)

    # ---------------------------------------------------------------
    # RUN ALL
    # ---------------------------------------------------------------
    def run_all(self):
        print(f"{Colors.BOLD}{Colors.BLUE}Bắt đầu test API tại: {self.base_url}{Colors.END}")
        print(f"Thời gian: {datetime.now().isoformat()}\n")

        # Kiểm tra server có chạy không
        resp, err = self.request("GET", "")
        # Root "/" không thuộc /api, thử gọi root riêng
        root_resp, _ = None, None
        try:
            root_resp = self.session.get(self.base_url.replace("/api", "") + "/", timeout=5)
        except Exception:
            pass
        if root_resp is None:
            print(f"{Colors.YELLOW}⚠️  Không thể xác nhận server đang chạy ở root '/'. Tiếp tục thử các API...{Colors.END}\n")

        self.test_auth()
        self.test_admin_auth()
        self.test_vocabulary()
        self.test_notebook()
        self.test_reading()
        self.test_listening()
        self.test_writing()
        self.test_statistics()
        self.test_admin_content_approval()
        self.test_admin_tests()
        self.test_admin_logs()
        self.test_admin_dashboard_module()

        self.print_summary()

    def print_summary(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        skipped = sum(1 for r in self.results if r["status"] == "SKIP")

        print(f"\n{Colors.BOLD}{'=' * 60}{Colors.END}")
        print(f"{Colors.BOLD}TỔNG KẾT: {total} test{Colors.END}")
        print(f"{Colors.GREEN}✅ PASS : {passed}{Colors.END}")
        print(f"{Colors.RED}❌ FAIL : {failed}{Colors.END}")
        print(f"{Colors.YELLOW}⏭️  SKIP : {skipped}{Colors.END}")
        print(f"{Colors.BOLD}{'=' * 60}{Colors.END}")

        if failed > 0:
            print(f"\n{Colors.RED}{Colors.BOLD}Chi tiết các test FAIL:{Colors.END}")
            for r in self.results:
                if r["status"] == "FAIL":
                    print(f"  - {r['name']}: {r['detail']}")

        sys.exit(1 if failed > 0 else 0)


def main():
    parser = argparse.ArgumentParser(description="Test toàn bộ API của backend English Learning App")
    parser.add_argument(
        "--base-url", default=DEFAULT_BASE_URL,
        help=f"Base URL của API (mặc định: {DEFAULT_BASE_URL})"
    )
    args = parser.parse_args()

    tester = ApiTester(args.base_url)
    tester.run_all()


if __name__ == "__main__":
    main()
