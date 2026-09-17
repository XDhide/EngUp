/**
 * SEED DATA SCRIPT
 * ------------------------------------------------------------
 * Tạo dữ liệu mẫu cho toàn bộ hệ thống để phục vụ việc test API
 * (chạy cùng file test_api.py trong thư mục /test).
 *
 * Cách chạy (từ thư mục gốc project "Backend"):
 *   1. Đảm bảo file .env đã cấu hình đúng DB_HOST / DB_USER / DB_PASSWORD / DB_NAME
 *   2. Đồng bộ cấu trúc bảng (nếu chưa có):
 *        npm run db:sync
 *   3. Chạy seed:
 *        node src/common/seed/seed.js
 *      (hoặc dùng script npm nếu đã thêm vào package.json: npm run db:seed)
 *
 * Script này an toàn để chạy nhiều lần (idempotent) — sẽ dùng
 * findOrCreate / kiểm tra tồn tại trước khi insert.
 */

require('dotenv').config();

const db = require('../models');
const { hashPassword } = require('../utils/password');

async function seedUsers() {
  const usersToCreate = [
    {
      email: 'admin@engup.test',
      password: 'Admin@123',
      full_name: 'Quản trị viên',
      role: 'admin',
      level_current: 'C1',
      learning_goal: 'Quản trị hệ thống',
      daily_target_minutes: 30
    },
    {
      email: 'student1@engup.test',
      password: 'Student@123',
      full_name: 'Nguyễn Văn A',
      role: 'student',
      level_current: 'B1',
      learning_goal: 'Giao tiếp công việc',
      daily_target_minutes: 20
    },
    {
      email: 'student2@engup.test',
      password: 'Student@123',
      full_name: 'Trần Thị B',
      role: 'student',
      level_current: 'A2',
      learning_goal: 'Luyện thi IELTS',
      daily_target_minutes: 15
    }
  ];

  const createdUsers = {};

  for (const u of usersToCreate) {
    const [user, created] = await db.User.findOrCreate({
      where: { email: u.email },
      defaults: {
        email: u.email,
        password_hash: await hashPassword(u.password),
        full_name: u.full_name,
        role: u.role,
        level_current: u.level_current,
        learning_goal: u.learning_goal,
        daily_target_minutes: u.daily_target_minutes,
        daily_new_word_limit: 10,
        is_active: true
      }
    });
    createdUsers[u.email] = user;
    console.log(`${created ? '✅ Tạo mới' : 'ℹ️  Đã tồn tại'} user: ${u.email} / mật khẩu: ${u.password}`);
  }

  return createdUsers;
}

async function seedVocabulary() {
  const [topicTravel] = await db.VocabularyTopic.findOrCreate({
    where: { name: 'Travel' },
    defaults: { name: 'Travel', description: 'Từ vựng chủ đề du lịch', image_url: null }
  });

  const [topicBusiness] = await db.VocabularyTopic.findOrCreate({
    where: { name: 'Business' },
    defaults: { name: 'Business', description: 'Từ vựng chủ đề kinh doanh', image_url: null }
  });

  const words = [
    { topic_id: topicTravel.id, word: 'itinerary', phonetic: '/aɪˈtɪnərəri/', meaning: 'lịch trình', example_sentence: 'Our itinerary includes three cities.', difficulty: 'B1' },
    { topic_id: topicTravel.id, word: 'luggage', phonetic: '/ˈlʌɡɪdʒ/', meaning: 'hành lý', example_sentence: 'Please keep your luggage with you.', difficulty: 'A2' },
    { topic_id: topicTravel.id, word: 'passport', phonetic: '/ˈpæspɔːrt/', meaning: 'hộ chiếu', example_sentence: 'Don\'t forget your passport.', difficulty: 'A1' },
    { topic_id: topicBusiness.id, word: 'negotiate', phonetic: '/nɪˈɡoʊʃieɪt/', meaning: 'đàm phán', example_sentence: 'They negotiated a better price.', difficulty: 'B2' },
    { topic_id: topicBusiness.id, word: 'revenue', phonetic: '/ˈrevənuː/', meaning: 'doanh thu', example_sentence: 'Revenue increased by 10%.', difficulty: 'B2' },
    { topic_id: topicBusiness.id, word: 'stakeholder', phonetic: '/ˈsteɪkhoʊldər/', meaning: 'các bên liên quan', example_sentence: 'All stakeholders agreed on the plan.', difficulty: 'C1' }
  ];

  const createdWords = [];
  for (const w of words) {
    const [word] = await db.VocabularyWord.findOrCreate({
      where: { word: w.word },
      defaults: w
    });
    createdWords.push(word);
  }

  console.log(`✅ Vocabulary: 2 topics, ${createdWords.length} words`);
  return { topics: [topicTravel, topicBusiness], words: createdWords };
}

async function seedReading() {
  const articlesData = [
    {
      title: 'A Day in London',
      content:
        'London is one of the most visited cities in the world. Tourists come to see Big Ben, ' +
        'the Tower of London and enjoy walking along the River Thames. Many visitors also like ' +
        'to try traditional British food such as fish and chips.',
      difficulty: 'A2',
      topic: 'Travel',
      is_ai_generated: false,
      is_approved: true,
      created_by: null,
      questions: [
        {
          question_text: 'What can tourists see in London?',
          options: ['A. Big Ben', 'B. Eiffel Tower', 'C. Great Wall', 'D. Statue of Liberty'],
          correct_answer: 'A',
          explanation: 'Đoạn văn nhắc đến Big Ben là một trong những địa điểm khách du lịch đến thăm.'
        },
        {
          question_text: 'What traditional food is mentioned?',
          options: ['A. Pizza', 'B. Sushi', 'C. Fish and chips', 'D. Tacos'],
          correct_answer: 'C',
          explanation: 'Đoạn văn nhắc đến "fish and chips" là món ăn truyền thống.'
        }
      ]
    },
    {
      title: 'The Future of Remote Work',
      content:
        'Remote work has become increasingly popular since the pandemic. Many companies now offer ' +
        'flexible working arrangements, allowing employees to work from home or anywhere in the world. ' +
        'While remote work offers freedom, it can also create challenges related to communication and ' +
        'team collaboration.',
      difficulty: 'B2',
      topic: 'Business',
      is_ai_generated: false,
      is_approved: true,
      created_by: null,
      questions: [
        {
          question_text: 'What has increased since the pandemic?',
          options: ['A. Office attendance', 'B. Remote work', 'C. Business travel', 'D. Overtime pay'],
          correct_answer: 'B',
          explanation: 'Câu đầu tiên nói rằng remote work đã trở nên phổ biến hơn kể từ đại dịch.'
        },
        {
          question_text: 'What challenge does remote work create?',
          options: ['A. Higher salary', 'B. Communication issues', 'C. More vacation days', 'D. Free lunch'],
          correct_answer: 'B',
          explanation: 'Đoạn văn đề cập thách thức liên quan đến giao tiếp và làm việc nhóm.'
        }
      ]
    }
  ];

  const createdArticles = [];
  for (const a of articlesData) {
    const { questions, ...articleFields } = a;
    const [article, created] = await db.ReadingArticle.findOrCreate({
      where: { title: a.title },
      defaults: articleFields
    });

    if (created) {
      for (const q of questions) {
        await db.ReadingQuestion.create({ article_id: article.id, ...q });
      }
    }
    createdArticles.push(article);
  }

  console.log(`✅ Reading: ${createdArticles.length} articles (with questions)`);
  return createdArticles;
}

async function seedListening() {
  const lessonsData = [
    {
      title: 'Ordering Coffee',
      audio_url: 'https://example.com/audio/ordering-coffee.mp3',
      transcript: 'Hi, can I get a medium latte with oat milk please? Sure, that will be five dollars.',
      difficulty: 'A2',
      topic: 'Daily Life'
    },
    {
      title: 'Job Interview Basics',
      audio_url: 'https://example.com/audio/job-interview.mp3',
      transcript: 'Tell me about yourself and why you want to work for our company.',
      difficulty: 'B1',
      topic: 'Business'
    }
  ];

  const createdLessons = [];
  for (const l of lessonsData) {
    const [lesson] = await db.ListeningLesson.findOrCreate({
      where: { title: l.title },
      defaults: l
    });
    createdLessons.push(lesson);
  }

  console.log(`✅ Listening: ${createdLessons.length} lessons`);
  return createdLessons;
}

async function seedWriting() {
  const promptsData = [
    {
      title: 'Describe your hometown',
      prompt_text: 'Write a paragraph (100-150 words) describing your hometown and what you like about it.',
      type: 'free',
      difficulty: 'A2'
    },
    {
      title: 'IELTS Task 2: Technology and Society',
      prompt_text:
        'Some people believe technology has made our lives more complicated. Others think it has made ' +
        'life easier. Discuss both views and give your own opinion.',
      type: 'ielts',
      difficulty: 'B2'
    }
  ];

  const createdPrompts = [];
  for (const p of promptsData) {
    const [prompt] = await db.WritingPrompt.findOrCreate({
      where: { title: p.title },
      defaults: p
    });
    createdPrompts.push(prompt);
  }

  console.log(`✅ Writing: ${createdPrompts.length} prompts`);
  return createdPrompts;
}

async function main() {
  try {
    console.log('⏳ Đang kết nối tới MySQL...');
    await db.sequelize.authenticate();
    console.log('✅ Kết nối thành công! Bắt đầu seed dữ liệu...\n');

    await seedUsers();
    await seedVocabulary();
    await seedReading();
    await seedListening();
    await seedWriting();

    console.log('\n🎉 Seed dữ liệu mẫu hoàn tất!');
    console.log('----------------------------------------');
    console.log('Tài khoản admin : admin@engup.test / Admin@123');
    console.log('Tài khoản HS 1  : student1@engup.test / Student@123');
    console.log('Tài khoản HS 2  : student2@engup.test / Student@123');
    console.log('----------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed dữ liệu thất bại:', err);
    process.exit(1);
  }
}

main();
