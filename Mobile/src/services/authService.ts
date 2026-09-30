import { apiRequest } from './apiClient';
import { Storage } from './storage';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  level_current: string | null;
  learning_goal: string | null;
  daily_target_minutes: number;
  daily_new_word_limit: number;
}

export interface AuthResponse {
  user: UserProfile;
  access_token: string;
  refresh_token: string;
}

// Backend trả options dạng { id: 'a', text: '...' }; đáp án gửi lên là id của option.
export interface PlacementOption {
  id: string;
  text: string;
}

export interface PlacementQuestion {
  id: number;
  question_text: string;
  options: PlacementOption[];
}

export interface PlacementSubmitResult {
  suggested_level: string;
}

type RawAuth = {
  user: { id: number; email: string; full_name: string };
  access_token: string;
  refresh_token: string;
};

async function persistSession(raw: RawAuth): Promise<AuthResponse> {
  await Storage.setAccessToken(raw.access_token);
  await Storage.setRefreshToken(raw.refresh_token);
  // login/register chỉ trả {id,email,full_name}; lấy hồ sơ đầy đủ từ /auth/me.
  let profile: UserProfile;
  try {
    profile = await apiRequest<UserProfile>('/auth/me');
  } catch {
    profile = {
      ...raw.user,
      level_current: null,
      learning_goal: null,
      daily_target_minutes: 15,
      daily_new_word_limit: 10,
    };
  }
  await Storage.setUser(profile);
  return { user: profile, access_token: raw.access_token, refresh_token: raw.refresh_token };
}

export const authService = {
  async register(data: { email: string; password: string; full_name: string }): Promise<AuthResponse> {
    const raw = await apiRequest<RawAuth>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return persistSession(raw);
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const raw = await apiRequest<RawAuth>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return persistSession(raw);
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await Storage.getRefreshToken();
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch {
      // Dù server lỗi vẫn xoá phiên cục bộ.
    } finally {
      await Storage.clearAuth();
    }
  },

  async getMe(): Promise<UserProfile> {
    const user = await apiRequest<UserProfile>('/auth/me');
    await Storage.setUser(user);
    return user;
  },

  // Backend chỉ cho sửa 3 field này (daily_new_word_limit dùng vocabularyService).
  async updateProfile(
    data: Partial<Pick<UserProfile, 'level_current' | 'learning_goal' | 'daily_target_minutes'>>
  ): Promise<UserProfile> {
    const user = await apiRequest<UserProfile>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await Storage.setUser(user);
    return user;
  },

  async getPlacementQuestions(): Promise<{ questions: PlacementQuestion[] }> {
    return apiRequest<{ questions: PlacementQuestion[] }>('/auth/placement-test/questions');
  },

  async submitPlacementTest(
    answers: Array<{ question_id: number; answer: string }>
  ): Promise<PlacementSubmitResult> {
    return apiRequest<PlacementSubmitResult>('/auth/placement-test/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },
};
