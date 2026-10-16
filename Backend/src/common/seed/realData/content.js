/**
 * Bộ sinh nội dung cho `npm run app:reset:real`: bài đọc + câu hỏi, bài nghe, đề viết, đề thi,
 * câu hỏi placement, gói đăng ký, mẫu thông báo...
 * Câu hỏi luôn khớp với nội dung (đáp án lấy đúng từ chỗ trống của câu văn), không phải dữ liệu ngẫu nhiên vô nghĩa.
 * Mọi hàm nhận `r` (bộ random có seed: int, pick, shuffle, sample, chance).
 */
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LETTERS = ['A', 'B', 'C', 'D'];

// ───────────────────────────── BÀI ĐỌC ─────────────────────────────
// frame = [câu văn có {S} (chủ đề) và {X} (chỗ trống), câu hỏi, danh sách đáp án khả dĩ cho {X}]
const READING_TOPICS = [
  { topic: 'Travel', subjects: ['Hoi An', 'Da Lat', 'Sapa', 'Hue', 'Nha Trang', 'Phu Quoc', 'Ha Long Bay', 'Can Tho', 'Ninh Binh', 'Quy Nhon'],
    frames: [
      ['{S} welcomes about {X} visitors every year.', 'How many visitors does {S} welcome every year?', ['two million', 'three million', 'half a million', 'five million', 'one million', 'four million']],
      ['The best time to visit {S} is {X}.', 'When is the best time to visit {S}?', ['in spring', 'in autumn', 'in winter', 'in early summer', 'during the dry season']],
      ['Most tourists travel to {S} by {X}.', 'How do most tourists travel to {S}?', ['plane', 'train', 'coach', 'motorbike', 'private car']],
      ['A popular activity in {S} is {X}.', 'What is a popular activity in {S}?', ['cycling through the countryside', 'taking a boat trip', 'visiting night markets', 'hiking in the hills', 'learning to cook local dishes']],
      ['Visitors usually stay for {X}.', 'How long do visitors usually stay?', ['two days', 'three days', 'a whole week', 'one night', 'five days']],
      ['A good souvenir from {S} is {X}.', 'What is a good souvenir from {S}?', ['handmade lanterns', 'silk scarves', 'ceramic cups', 'dried fruit', 'wooden toys']]] },
  { topic: 'Business', subjects: ['Green Leaf Coffee', 'Blue Wave Logistics', 'Sunrise Bakery', 'Lotus Software', 'Mekong Foods', 'Bright Path Tutors', 'Urban Bike Shop', 'Pearl Fashion'],
    frames: [
      ['{S} was founded {X}.', 'When was {S} founded?', ['in 2005', 'in 2010', 'in 2014', 'in 2018', 'in 1998']],
      ['The company employs {X} people.', 'How many people does {S} employ?', ['about fifty', 'around two hundred', 'nearly one thousand', 'only ten', 'about three hundred']],
      ['Its main customers are {X}.', 'Who are the main customers of {S}?', ['university students', 'office workers', 'young families', 'foreign tourists', 'small shops']],
      ['Last year, sales grew by {X}.', 'By how much did sales grow last year at {S}?', ['ten percent', 'twenty percent', 'five percent', 'thirty percent', 'fifteen percent']],
      ['The company plans to open {X}.', 'What does {S} plan to open?', ['a new office in Hanoi', 'ten new shops', 'an online store', 'a training centre', 'a factory in the south']],
      ['The manager says that {X} is the key to success.', 'What does the manager say is the key to success?', ['good teamwork', 'low prices', 'fast delivery', 'honest advice', 'clear goals']]] },
  { topic: 'Technology', subjects: ['smart phones', 'online learning', 'electric cars', 'video calls', 'social media', 'robots at work', 'cloud storage', 'e-books'],
    frames: [
      ['The popularity of {S} began to grow {X}.', 'When did the popularity of {S} begin to grow?', ['ten years ago', 'five years ago', 'during the pandemic', 'in the 1990s', 'two years ago']],
      ['Experts say that {S} are most useful for {X}.', 'Who finds {S} most useful, according to experts?', ['busy parents', 'young students', 'small businesses', 'elderly people', 'travelling workers']],
      ['One problem with {S} is {X}.', 'What is one problem with {S}?', ['high cost', 'privacy risks', 'slow internet', 'too much screen time', 'lack of training']],
      ['About {X} of people in cities now use {S}.', 'What share of city people use {S}?', ['half', 'two thirds', 'one quarter', 'ninety percent', 'one third']],
      ['In the future, {S} will probably become {X}.', 'What will {S} probably become in the future?', ['cheaper', 'faster', 'safer', 'more personal', 'easier to use']]] },
  { topic: 'Health', subjects: ['regular exercise', 'a healthy breakfast', 'good sleep', 'drinking water', 'walking every day', 'eating more vegetables', 'less sugar', 'yoga classes'],
    frames: [
      ['Doctors recommend {S} for at least {X}.', 'For how long do doctors recommend {S}?', ['thirty minutes a day', 'one hour a day', 'three times a week', 'ten minutes a day', 'every morning']],
      ['People who practise {S} often feel {X}.', 'How do people who practise {S} often feel?', ['more energetic', 'less stressed', 'happier', 'more focused', 'stronger']],
      ['A recent study of {X} adults supports this idea.', 'How many adults took part in the study?', ['two thousand', 'five hundred', 'ten thousand', 'one hundred', 'three thousand']],
      ['The study was carried out by {X}.', 'Who carried out the study?', ['a university team', 'a hospital', 'a sports club', 'a health ministry', 'a group of nurses']],
      ['Beginners should start {X}.', 'How should beginners start?', ['slowly', 'with a friend', 'with a short walk', 'with a doctor’s advice', 'at the weekend']]] },
  { topic: 'Food', subjects: ['pho', 'banh mi', 'spring rolls', 'Vietnamese coffee', 'fresh fruit salad', 'sticky rice', 'grilled fish', 'vegetable soup'],
    frames: [
      ['The main ingredient is {X}.', 'What is the main ingredient of {S}?', ['rice', 'beef', 'fresh herbs', 'shrimp', 'sweet potato']],
      ['Locals often have {S} {X}.', 'When do locals often have {S}?', ['for breakfast', 'at lunch', 'as a late-night snack', 'during festivals', 'with the family on Sunday']],
      ['A good portion costs about {X}.', 'How much does a good portion cost?', ['thirty thousand dong', 'fifty thousand dong', 'twenty thousand dong', 'seventy thousand dong', 'ten thousand dong']],
      ['The best version is found in {X}.', 'Where is the best version of {S} found?', ['small street stalls', 'family restaurants', 'the central market', 'the countryside', 'old neighbourhoods']],
      ['Many people add {X} for extra flavor.', 'What do many people add for extra flavor?', ['chili', 'lime juice', 'fish sauce', 'fresh basil', 'black pepper']]] },
  { topic: 'Environment', subjects: ['the Red River', 'Cat Tien National Park', 'the Mekong Delta', 'Ba Be Lake', 'Con Dao Islands', 'Cuc Phuong Forest', 'Tram Chim Wetlands', 'Bach Ma Mountain'],
    frames: [
      ['The area covers about {X} square kilometres.', 'How large is the area of {S}?', ['one hundred', 'five hundred', 'two thousand', 'eighty', 'one thousand']],
      ['It is home to {X}.', 'What is {S} home to?', ['rare birds', 'hundreds of plant species', 'wild monkeys', 'sea turtles', 'unique fish']],
      ['The biggest threat to the area is {X}.', 'What is the biggest threat to {S}?', ['pollution', 'illegal hunting', 'climate change', 'too many tourists', 'deforestation']],
      ['Local people help protect it by {X}.', 'How do local people help protect {S}?', ['planting trees', 'collecting rubbish', 'guiding visitors', 'reporting hunters', 'limiting fishing']],
      ['Volunteers visit the area {X}.', 'How often do volunteers visit the area?', ['every month', 'every summer', 'twice a year', 'every weekend', 'every spring']]] },
  { topic: 'Education', subjects: ['Linh', 'Minh', 'Hoa', 'Duc', 'Mai', 'Khanh', 'Lan', 'Tuan'],
    frames: [
      ['{S} studies {X} at university.', 'What does {S} study at university?', ['engineering', 'medicine', 'economics', 'English literature', 'computer science']],
      ['Every morning, {S} gets up at {X}.', 'What time does {S} get up every morning?', ['five thirty', 'six', 'six thirty', 'seven', 'half past five']],
      ['To improve English, {S} {X}.', 'How does {S} improve English?', ['watches films with subtitles', 'reads a short article daily', 'practises with a tutor', 'writes a diary', 'learns ten new words a day']],
      ['{S} finds {X} the most difficult.', 'What does {S} find the most difficult?', ['listening', 'writing essays', 'speaking in class', 'grammar', 'pronunciation']],
      ['After graduation, {S} hopes to {X}.', 'What does {S} hope to do after graduation?', ['work abroad', 'become a teacher', 'start a company', 'do a master’s degree', 'travel around Asia']]] },
  { topic: 'Sports', subjects: ['the Hanoi Eagles', 'the Saigon Tigers', 'the Hue Dragons', 'the Da Nang Waves', 'the Can Tho Lions', 'the Hai Phong Sharks'],
    frames: [
      ['{S} train {X}.', 'When does the team train?', ['every evening', 'three mornings a week', 'at the weekend', 'twice a day', 'on Tuesdays and Thursdays']],
      ['The team has won the league {X}.', 'How many times has the team won the league?', ['twice', 'four times', 'seven times', 'never', 'three times']],
      ['The most famous player is {X}.', 'Who is the most famous player on the team?', ['the goalkeeper', 'the captain', 'a young striker', 'the oldest defender', 'a midfielder from Hue']],
      ['Home games are played in {X}.', 'Where does the team play home games?', ['a modern stadium', 'a small city hall', 'a school gym', 'an old stadium', 'the central sports park']],
      ['Tickets for a match cost {X}.', 'How much do tickets for a match cost?', ['fifty thousand dong', 'one hundred thousand dong', 'thirty thousand dong', 'two hundred thousand dong']]] },
  { topic: 'Culture', subjects: ['Tet', 'the Mid-Autumn Festival', 'the Hung Kings Festival', 'the Lantern Festival', 'the Hue Festival', 'the Perfume Pagoda Festival', 'the Lim Festival', 'the Kate Festival'],
    frames: [
      ['{S} is celebrated {X}.', 'When is {S} celebrated?', ['in January or February', 'in September', 'in the spring', 'every year', 'in the lunar calendar']],
      ['Families often {X} during the event.', 'What do families often do during {S}?', ['cook special food', 'visit relatives', 'clean the house', 'give gifts to children', 'gather at the family home']],
      ['A traditional symbol of the event is {X}.', 'What is a traditional symbol of {S}?', ['a red envelope', 'a paper lantern', 'a peach blossom', 'a round cake', 'a wooden mask']],
      ['Young people like {X}.', 'What do young people like about {S}?', ['taking photos', 'meeting old friends', 'the music', 'the colors', 'the street food']],
      ['Tourists are advised to {X}.', 'What are tourists advised to do?', ['book hotels early', 'dress politely', 'try local snacks', 'ask before taking photos', 'arrive early']]] },
  { topic: 'Science', subjects: ['honey bees', 'sea turtles', 'volcanoes', 'rainforests', 'dolphins', 'solar panels', 'coral reefs', 'penguins'],
    frames: [
      ['Scientists have studied {S} for {X}.', 'For how long have scientists studied {S}?', ['over fifty years', 'about twenty years', 'a long time', 'only ten years', 'more than a century']],
      ['One surprising fact is that {S} {X}.', 'What is one surprising fact about {S}?', ['change over time', 'react to sound', 'need very little energy', 'work in groups', 'can be found everywhere']],
      ['Research is usually done in {X}.', 'Where is research on {S} usually done?', ['a laboratory', 'the field', 'a university', 'a research ship', 'a national centre']],
      ['The most recent study was published {X}.', 'When was the most recent study published?', ['last month', 'last year', 'in March', 'two years ago', 'this spring']],
      ['Researchers hope to learn more about {X}.', 'What do researchers hope to learn more about?', ['how it began', 'how it changes', 'how to protect it', 'how it affects us', 'how it communicates']]] },
  { topic: 'City Life', subjects: ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Bien Hoa', 'Vung Tau', 'Thu Duc', 'Buon Ma Thuot'],
    frames: [
      ['About {X} people live in {S}.', 'How many people live in {S}?', ['two million', 'one million', 'nine million', 'five hundred thousand', 'eight million']],
      ['The main problem in {S} is {X}.', 'What is the main problem in {S}?', ['traffic jams', 'noise', 'high rents', 'air pollution', 'a lack of parks']],
      ['Many residents travel to work by {X}.', 'How do many residents of {S} travel to work?', ['motorbike', 'bus', 'bicycle', 'subway', 'car']],
      ['The city is planning to build {X}.', 'What is {S} planning to build?', ['a new bridge', 'a metro line', 'more parks', 'a cycle lane', 'a library']],
      ['Rents are highest in {X}.', 'Where are rents highest in {S}?', ['the city centre', 'the old quarter', 'the new district', 'the riverside', 'the north']]] },
  { topic: 'Work', subjects: ['remote work', 'part-time jobs', 'job interviews', 'team meetings', 'office life', 'freelancing', 'internships', 'career changes'],
    frames: [
      ['Surveys show that {X} of workers prefer {S}.', 'What share of workers prefer {S}?', ['forty percent', 'sixty percent', 'one quarter', 'most', 'about half']],
      ['One advantage of {S} is {X}.', 'What is one advantage of {S}?', ['more freedom', 'a better balance', 'lower costs', 'new skills', 'less commuting']],
      ['One disadvantage of {S} is {X}.', 'What is one disadvantage of {S}?', ['loneliness', 'less income', 'long hours', 'stress', 'poor communication']],
      ['Experts advise people to {X}.', 'What do experts advise people to do?', ['set a clear schedule', 'ask for feedback', 'keep learning', 'take regular breaks', 'build a network']],
      ['Younger employees especially value {X}.', 'What do younger employees especially value?', ['flexible hours', 'training', 'a friendly team', 'good pay', 'job security']]] }
];
const TITLE_TEMPLATES = ['All About {S}', 'A Closer Look at {S}', 'Why {S} Matters', 'Discovering {S}', '{S}: Facts and Figures', 'A Short Guide to {S}', 'What Makes {S} Special', '{S} in Focus', 'Understanding {S}', 'The Story of {S}'];
const INTROS = ['Many people are curious about {S}.', 'Few topics attract as much attention as {S}.', 'Here is what you need to know about {S}.', 'Recently, {S} has appeared in many conversations.'];
const OUTROS = ['In short, there is plenty more to learn about {S}.', 'This is why many readers keep asking about {S}.', 'Overall, there is much more to discover about {S}.', 'For these reasons, many readers want to know more about {S}.'];

const fill = (tpl, S, X) => {
  const t = tpl.replace(/\{S\}/g, S).replace(/\{X\}/g, X);
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function buildQuestion(r, text, correct, pool) {
  const wrong = r.sample(pool.filter((p) => p !== correct), 3);
  const opts = r.shuffle([correct, ...wrong]);
  return { question_text: text, options: opts.map((o, i) => `${LETTERS[i]}. ${o}`), correct_answer: LETTERS[opts.indexOf(correct)] };
}

/** Sinh 1 bài đọc (nội dung + câu hỏi trắc nghiệm khớp nội dung). */
function makeReading(r, usedTitles, { frameCount } = {}) {
  const t = r.pick(READING_TOPICS);
  let S, title, tries = 0;
  do { S = r.pick(t.subjects); title = fill(r.pick(TITLE_TEMPLATES), S, ''); tries += 1; } while (usedTitles.has(title) && tries < 80);
  if (usedTitles.has(title)) title = `${title} (${r.int(2, 99)})`;
  usedTitles.add(title);
  const n = Math.min(frameCount || r.int(3, 5), t.frames.length);
  const frames = r.sample(t.frames, n);
  const sentences = [], questions = [];
  frames.forEach(([sent, q, pool]) => {
    const X = r.pick(pool);
    sentences.push(fill(sent, S, X));
    questions.push({ ...buildQuestion(r, fill(q, S, X), X, pool), explanation: `Đoạn văn nêu rõ: "${fill(sent, S, X)}"` });
  });
  const mid = Math.ceil(sentences.length / 2);
  const content = `${fill(r.pick(INTROS), S, '')} ${sentences.slice(0, mid).join(' ')}\n\n${sentences.slice(mid).join(' ')} ${fill(r.pick(OUTROS), S, '')}`;
  const others = r.sample(t.subjects.filter((s) => s !== S), 3);
  const main = r.shuffle([S, ...others]);
  questions.unshift({
    question_text: 'What is the passage mainly about?',
    options: main.map((o, i) => `${LETTERS[i]}. Information about ${o}`),
    correct_answer: LETTERS[main.indexOf(S)],
    explanation: `Toàn bộ đoạn văn đều nói về ${S}.`
  });
  return { title, topic: t.topic, content, questions };
}

// ───────────────────────────── BÀI NGHE ─────────────────────────────
// lines: câu thoại có {slot}; slots: kho giá trị; q: [slot được hỏi, câu hỏi]
const LISTENING_SCENARIOS = [
  { topic: 'Daily Life', name: 'Ordering at a Cafe', slots: { drink: ['a latte', 'an iced coffee', 'a green tea', 'a mango smoothie', 'a hot chocolate'], size: ['small', 'medium', 'large'], price: ['three dollars', 'four dollars', 'five dollars', 'six dollars'] },
    lines: ['Hi, can I get {drink}, please?', 'Of course. What size would you like?', '{size}, please.', 'That will be {price}. Anything else?', 'No, thank you. That is all.'], q: ['drink', 'What does the customer order?'] },
  { topic: 'Travel', name: 'Asking for Directions', slots: { place: ['the post office', 'the train station', 'the city museum', 'the central library', 'the bus terminal'], turn: ['left', 'right'], dist: ['two blocks', 'three blocks', 'five minutes', 'ten minutes'] },
    lines: ['Excuse me, how do I get to {place}?', 'Go straight and turn {turn} at the traffic lights.', 'Is it far from here?', 'No, it is only {dist} on foot.', 'Great, thank you very much!'], q: ['place', 'Where does the man want to go?'] },
  { topic: 'Travel', name: 'Hotel Check-in', slots: { nights: ['two nights', 'three nights', 'four nights', 'one week'], room: ['a single room', 'a double room', 'a family room', 'a room with a sea view'], time: ['seven', 'eight', 'nine', 'half past six'] },
    lines: ['Good evening. I have a reservation for {nights}.', 'Certainly. You booked {room}, is that right?', 'Yes. What time is breakfast served?', 'Breakfast starts at {time} in the morning.', 'Perfect. Here is your key card.'], q: ['nights', 'How long will the guest stay?'] },
  { topic: 'Business', name: 'Job Interview', slots: { job: ['sales assistant', 'office clerk', 'English teacher', 'graphic designer', 'customer service agent'], years: ['two years', 'three years', 'five years', 'six months'], day: ['Monday', 'Wednesday', 'Friday'] },
    lines: ['Thank you for coming. You applied for the {job} position.', 'Yes. I have {years} of experience in a similar role.', 'That sounds good. Why do you want to join us?', 'I like your friendly team and I want to learn more.', 'We will contact you on {day}.'], q: ['job', 'Which job did the woman apply for?'] },
  { topic: 'Health', name: 'At the Doctor', slots: { problem: ['a sore throat', 'a headache', 'a high fever', 'back pain', 'a bad cough'], days: ['two days', 'three days', 'a week'], advice: ['drink more water', 'rest at home', 'take the medicine twice a day', 'avoid cold drinks'] },
    lines: ['What seems to be the problem today?', 'I have had {problem} for {days}.', 'Let me check. It is not serious.', 'You should {advice} and come back next week.', 'Thank you, doctor.'], q: ['problem', 'What is the patient’s problem?'] },
  { topic: 'Shopping', name: 'Buying Clothes', slots: { item: ['a blue shirt', 'a pair of jeans', 'a warm jacket', 'white sneakers', 'a summer dress'], size: ['small', 'medium', 'large'], price: ['twenty dollars', 'thirty dollars', 'forty dollars', 'fifty dollars'] },
    lines: ['Hello, I am looking for {item}.', 'What size do you need?', 'I think I am a {size}.', 'This one costs {price}. Would you like to try it on?', 'Yes, where is the fitting room?'], q: ['item', 'What does the customer want to buy?'] },
  { topic: 'Travel', name: 'At the Airport', slots: { dest: ['Singapore', 'Tokyo', 'Seoul', 'Bangkok', 'Sydney'], gate: ['gate five', 'gate twelve', 'gate twenty', 'gate eight'], time: ['ten fifteen', 'eleven thirty', 'two forty', 'six fifty'] },
    lines: ['Good morning. Where are you flying to today?', 'I am flying to {dest}.', 'Your flight leaves at {time} from {gate}.', 'Is the flight on time?', 'Yes, boarding starts forty minutes before departure.'], q: ['dest', 'Where is the passenger flying to?'] },
  { topic: 'Education', name: 'Joining a Class', slots: { course: ['English conversation', 'basic computer skills', 'IELTS writing', 'business English', 'French for beginners'], day: ['Tuesday', 'Thursday', 'Saturday'], fee: ['one million dong', 'two million dong', 'three million dong'] },
    lines: ['I would like to join the {course} course.', 'Classes are on {day} evenings.', 'How much is the fee?', 'The fee is {fee} for the whole term.', 'Can I pay by card?'], q: ['course', 'Which course does the student want to join?'] },
  { topic: 'Finance & Banking', name: 'At the Bank', slots: { service: ['open a savings account', 'send money abroad', 'change some dollars', 'apply for a loan', 'report a lost card'], id: ['your passport', 'your ID card', 'a proof of address'], wait: ['ten minutes', 'fifteen minutes', 'half an hour'] },
    lines: ['Good afternoon. I would like to {service}.', 'Certainly. May I see {id}?', 'Here you are.', 'Please take a seat. It will take about {wait}.', 'Thank you for your help.'], q: ['service', 'What does the customer want to do at the bank?'] },
  { topic: 'Housing', name: 'Renting an Apartment', slots: { rooms: ['one bedroom', 'two bedrooms', 'three bedrooms'], rent: ['five million dong', 'six million dong', 'eight million dong', 'twelve million dong'], area: ['near the park', 'close to the university', 'in the city centre', 'next to the market'] },
    lines: ['I saw your advertisement for the apartment with {rooms}.', 'Yes, it is available. It is {area}.', 'How much is the rent?', 'The rent is {rent} a month.', 'Can I visit it this weekend?'], q: ['rent', 'How much is the monthly rent?'] }
];

function makeListening(r, usedTitles) {
  const sc = r.pick(LISTENING_SCENARIOS);
  const vals = {};
  Object.entries(sc.slots).forEach(([k, pool]) => { vals[k] = r.pick(pool); });
  const transcript = sc.lines.map((l) => l.replace(/\{(\w+)\}/g, (_, k) => vals[k])).join(' ');
  let title = sc.name, i = 1;
  while (usedTitles.has(title)) { i += 1; title = `${sc.name} ${i}`; }
  usedTitles.add(title);
  const [slot, qtext] = sc.q;
  const q = buildQuestion(r, qtext, vals[slot], sc.slots[slot]);
  return { title, topic: sc.topic, transcript, question: { ...q } };
}

// ───────────────────────────── ĐỀ VIẾT ─────────────────────────────
const FREE_TOPICS = ['your hometown', 'your best friend', 'your favourite food', 'a memorable trip', 'your daily routine', 'your dream job', 'your favourite season', 'a festival you enjoy', 'your school days', 'a place you want to visit', 'your family', 'a hobby you love', 'your favourite teacher', 'a day at the beach', 'your first day at work', 'a book you enjoyed', 'your neighbourhood', 'how you learn English', 'your weekend plans', 'a person you admire'];
const IELTS_CLAIMS = ['technology has made our lives more complicated', 'children should start learning a foreign language at primary school', 'university education should be free for everyone', 'working from home is better than working in an office', 'social media does more harm than good', 'governments should spend more money on public transport', 'people today spend too much time on their phones', 'zoos are cruel and should be closed', 'online shopping will replace traditional shops', 'students should wear school uniforms', 'fast food is the main cause of poor health', 'young people should do volunteer work', 'tourism damages local culture', 'money is the most important factor in choosing a job', 'cities should ban private cars in the centre', 'homework should be abolished', 'artificial intelligence will take most jobs', 'reading books is better than watching films', 'older workers should retire earlier to give jobs to young people', 'celebrities have too much influence on young people'];
const TOEIC_SITUATIONS = [['a customer', 'a delayed delivery', 'explain the problem and ask for a refund'], ['your manager', 'a request for a day off', 'give the dates and the reason'], ['a hotel', 'a booking you need to change', 'ask for a new date and the price'], ['a colleague', 'a meeting you cannot attend', 'apologise and suggest another time'], ['a supplier', 'a price increase', 'ask for an explanation and a discount'], ['a landlord', 'a broken air conditioner', 'describe the problem and ask for a repair'], ['a school', 'an English course', 'ask about the schedule and the fee'], ['an airline', 'lost luggage', 'describe the bag and give your contact details'], ['a team member', 'a new project', 'explain the first three tasks'], ['a client', 'a product demonstration', 'invite them and suggest two dates'], ['a bank', 'a mistake on your statement', 'explain the error and ask for a correction'], ['a neighbour', 'loud music at night', 'politely ask them to be quieter']];

function makeWritingPrompts(r) {
  const out = [];
  const levelsFree = ['A1', 'A2', 'A2', 'B1'];
  FREE_TOPICS.forEach((tp) => out.push({ title: `Write about ${tp}`, prompt_text: `Write a paragraph (100-150 words) about ${tp}. Say what you like about it and give at least two examples.`, type: 'free', difficulty: r.pick(levelsFree) }));
  FREE_TOPICS.slice(0, 12).forEach((tp) => out.push({ title: `Short description: ${tp}`, prompt_text: `Write 5-7 simple sentences about ${tp}. Use the present simple tense.`, type: 'free', difficulty: 'A1' }));
  IELTS_CLAIMS.forEach((c) => {
    out.push({ title: `IELTS Task 2: ${c.slice(0, 55)}`, prompt_text: `Some people believe that ${c}. Others disagree. Discuss both views and give your own opinion. Write at least 250 words.`, type: 'ielts', difficulty: r.pick(['B2', 'B2', 'C1']) });
    out.push({ title: `IELTS Task 2 (agree/disagree): ${c.slice(0, 40)}`, prompt_text: `To what extent do you agree or disagree that ${c}? Give reasons and relevant examples. Write at least 250 words.`, type: 'ielts', difficulty: r.pick(['B2', 'C1', 'C1']) });
  });
  TOEIC_SITUATIONS.forEach(([who, about, ask]) => out.push({ title: `TOEIC Email: ${about}`, prompt_text: `Write an email to ${who} about ${about}. In your email, ${ask}. Write 80-120 words.`, type: 'toeic', difficulty: r.pick(['B1', 'B2']) }));
  return out;
}

// ───────────────────────────── CÂU NGỮ PHÁP (cho đề thi + placement) ─────────────────────────────
const SUBJ3 = ['She', 'He', 'My brother', 'The teacher', 'Our manager', 'Linh', 'The new student', 'My uncle'];
const VERB_S = [['work', 'works', 'working', 'worked', 'at a bank in Hanoi'], ['study', 'studies', 'studying', 'studied', 'English every evening'], ['watch', 'watches', 'watching', 'watched', 'the news before dinner'], ['live', 'lives', 'living', 'lived', 'near the central market'], ['play', 'plays', 'playing', 'played', 'football on Sundays'], ['teach', 'teaches', 'teaching', 'taught', 'maths at a high school'], ['drive', 'drives', 'driving', 'drove', 'to the office every morning'], ['cook', 'cooks', 'cooking', 'cooked', 'dinner for the whole family']];
const VERB_PAST = [['go', 'went', 'gone', 'going', 'to Hue by train'], ['see', 'saw', 'seen', 'seeing', 'a great film at the cinema'], ['eat', 'ate', 'eaten', 'eating', 'pho for breakfast'], ['buy', 'bought', 'bought', 'buying', 'a new laptop online'], ['write', 'wrote', 'written', 'writing', 'a long report for the manager'], ['take', 'took', 'taken', 'taking', 'the bus to the airport'], ['come', 'came', 'come', 'coming', 'to the meeting very late'], ['give', 'gave', 'given', 'giving', 'a short speech to the class']];
const PREP_TIME = [['9 a.m.', 'at'], ['Monday', 'on'], ['July', 'in'], ['the evening', 'in'], ['noon', 'at'], ['2025', 'in'], ['my birthday', 'on'], ['night', 'at'], ['the weekend', 'at'], ['Friday morning', 'on'], ['the summer', 'in'], ['half past two', 'at']];
const ARTICLES = [['engineer', 'an'], ['teacher', 'a'], ['university', 'a'], ['hour', 'an'], ['umbrella', 'an'], ['European tour', 'a'], ['honest man', 'an'], ['unique idea', 'a'], ['MBA degree', 'an'], ['uniform', 'a']];
const COMPARATIVES = [['This laptop is ___ than that one.', 'cheaper', 'more cheap', 'cheapest', 'more cheaper'], ['Today is ___ than yesterday.', 'hotter', 'more hot', 'hottest', 'more hotter'], ['This exercise is ___ than the last one.', 'more difficult', 'difficulter', 'most difficult', 'more difficulter'], ['My sister is ___ student in the class.', 'the best', 'better', 'the better', 'best of'], ['The bus is ___ than the train.', 'slower', 'more slow', 'slowest', 'most slower'], ['This is ___ hotel in the city.', 'the most expensive', 'more expensive', 'the more expensive', 'most expensive of'], ['English is ___ for me than maths.', 'easier', 'more easy', 'easiest', 'more easier'], ['She speaks ___ than her brother.', 'more clearly', 'more clear', 'clearlier', 'most clearly']];
const COND2 = [['If I ___ more time, I would learn French.', 'had', 'have', 'will have', 'having'], ['If she ___ harder, she would pass the exam.', 'studied', 'studies', 'will study', 'studying'], ['I would buy a car if I ___ rich.', 'were', 'am', 'will be', 'being'], ['If we ___ earlier, we would catch the train.', 'left', 'leave', 'will leave', 'leaving'], ['What would you do if you ___ the lottery?', 'won', 'win', 'will win', 'winning'], ['If it ___ tomorrow, we would stay at home.', 'rained', 'rains', 'will rain', 'raining']];
const PASSIVE = [['The report ___ by the manager yesterday.', 'was approved', 'approved', 'was approve', 'has approving'], ['English ___ in many countries around the world.', 'is spoken', 'speaks', 'is speaking', 'are spoken'], ['The new bridge ___ next year.', 'will be built', 'will build', 'is building', 'builds'], ['These photos ___ by my brother.', 'were taken', 'was taken', 'took', 'are taking'], ['The windows ___ every week.', 'are cleaned', 'is cleaned', 'cleans', 'cleaning'], ['The email ___ before the meeting started.', 'had been sent', 'had sent', 'was sending', 'has been send']];
const PERFECT = [['3 years', 'for'], ['2019', 'since'], ['a long time', 'for'], ['last Monday', 'since'], ['two hours', 'for'], ['I was a child', 'since'], ['ten minutes', 'for'], ['January', 'since']];

function mcq(r, text, correct, wrongs) {
  const opts = r.shuffle([correct, ...wrongs]);
  return { question_text: text, question_type: 'multiple_choice', options: opts.map((o, i) => `${LETTERS[i]}. ${o}`), correct_answer: LETTERS[opts.indexOf(correct)] };
}

/** Sinh 1 câu ngữ pháp trắc nghiệm / điền từ. Trả {question_text, question_type, options?, correct_answer, level}. */
function makeGrammar(r) {
  const k = r.int(0, 8);
  if (k === 0) { const s = r.pick(SUBJ3), v = r.pick(VERB_S); return { ...mcq(r, `${s} ___ ${v[4]}.`, v[1], [v[0], v[2], v[3]]), level: 'A1' }; }
  if (k === 1) { const v = r.pick(VERB_PAST); return { ...mcq(r, `Last week, we ___ ${v[4]}.`, v[1], [v[0], v[2], v[3]]), level: 'A2' }; }
  if (k === 2) { const [t, p] = r.pick(PREP_TIME); if (r.chance(0.4)) return { question_text: `The meeting starts ___ ${t}. (in/on/at)`, question_type: 'fill_blank', correct_answer: p, level: 'A2' }; return { ...mcq(r, `The meeting starts ___ ${t}.`, p, ['in', 'on', 'at', 'by'].filter((x) => x !== p).slice(0, 3)), level: 'A2' }; }
  if (k === 3) { const [n, a] = r.pick(ARTICLES); return { ...mcq(r, `She is ___ ${n}.`, a, ['a', 'an', 'the', 'no article'].filter((x) => x !== a).slice(0, 3)), level: 'A1' }; }
  if (k === 4) { const c = r.pick(COMPARATIVES); return { ...mcq(r, c[0], c[1], c.slice(2)), level: 'B1' }; }
  if (k === 5) { const c = r.pick(COND2); return { ...mcq(r, c[0], c[1], c.slice(2)), level: 'B1' }; }
  if (k === 6) { const c = r.pick(PASSIVE); return { ...mcq(r, c[0], c[1], c.slice(2)), level: 'B2' }; }
  const [t, p] = r.pick(PERFECT);
  return { ...mcq(r, `I have worked here ___ ${t}.`, p, ['for', 'since', 'during', 'from'].filter((x) => x !== p).slice(0, 3)), level: 'B1' };
}

// ───────────────────────────── PLACEMENT (ngân hàng thêm, mặc định không bật) ─────────────────────────────
function makePlacementBank(r, count) {
  const out = [], seen = new Set();
  let guard = 0;
  while (out.length < count && guard < count * 40) {
    guard += 1;
    const g = makeGrammar(r);
    if (g.question_type !== 'multiple_choice' || seen.has(g.question_text)) continue;
    seen.add(g.question_text);
    const letters = ['a', 'b', 'c', 'd'];
    out.push({
      level: g.level,
      question_text: g.question_text,
      options: g.options.map((o, i) => ({ id: letters[i], text: o.replace(/^[A-D]\.\s*/, '') })),
      correct_option_id: letters[LETTERS.indexOf(g.correct_answer)]
    });
  }
  return out;
}

// ───────────────────────────── KHÁC ─────────────────────────────
const PLANS = [
  { name: 'Free', price: 0, duration_days: 36500, features: ['Học 10 từ mới mỗi ngày', 'Ôn tập SRS cơ bản', 'Bài đọc & nghe giới hạn'] },
  { name: 'Basic 1 tháng', price: 49000, duration_days: 30, features: ['20 từ mới mỗi ngày', 'Không quảng cáo', 'Thống kê cơ bản'] },
  { name: 'Pro 3 tháng', price: 129000, duration_days: 90, features: ['Không giới hạn từ mới', 'Chấm Viết bằng AI 20 lượt/ngày', 'Luyện đề IELTS/TOEIC'] },
  { name: 'Pro 6 tháng', price: 229000, duration_days: 180, features: ['Mọi quyền lợi gói Pro', 'Lộ trình học cá nhân hóa', 'Ưu tiên hỗ trợ'] },
  { name: 'Premium 12 tháng', price: 399000, duration_days: 365, features: ['Mọi tính năng', 'Chấm Viết AI không giới hạn', 'Báo cáo tiến độ hằng tuần'] },
  { name: 'Student 3 tháng', price: 79000, duration_days: 90, features: ['Giá ưu đãi cho sinh viên', 'Luyện đề IELTS/TOEIC', 'Chấm Viết AI 10 lượt/ngày'] },
  { name: 'Lifetime', price: 1499000, duration_days: 3650, features: ['Dùng trọn đời', 'Mọi tính năng hiện tại và tương lai'] }
];

const NOTIFICATION_TEMPLATES = [
  { name: 'review_due_default', title_template: 'Đến giờ ôn từ! 🔔', body_template: 'Bạn có {{count}} từ cần ôn tập hôm nay.', type: 'review_due' },
  { name: 'daily_reminder_default', title_template: 'Nhắc học từ vựng 📚', body_template: 'Đã đến giờ học từ mới hôm nay, vào ôn luyện ngay nhé!', type: 'daily_reminder' },
  { name: 'streak_warning', title_template: 'Chuỗi ngày học sắp bị đứt 🔥', body_template: 'Hôm nay bạn chưa học. Học 5 phút để giữ chuỗi nhé!', type: 'streak' },
  { name: 'streak_milestone_7', title_template: 'Chuỗi 7 ngày liên tiếp! 🎉', body_template: 'Tuyệt vời, bạn đã học 7 ngày liên tục.', type: 'streak' },
  { name: 'streak_milestone_30', title_template: 'Chuỗi 30 ngày! 🏆', body_template: 'Bạn thật kiên trì, 30 ngày học liên tiếp!', type: 'streak' },
  { name: 'welcome', title_template: 'Chào mừng đến với EngUp 👋', body_template: 'Hãy làm bài kiểm tra trình độ để nhận lộ trình phù hợp.', type: 'system' },
  { name: 'new_reading', title_template: 'Có bài đọc mới 📖', body_template: 'Một bài đọc mới vừa được thêm, thử sức ngay!', type: 'system' },
  { name: 'new_listening', title_template: 'Có bài nghe mới 🎧', body_template: 'Luyện nghe chép chính tả với bài mới hôm nay.', type: 'system' },
  { name: 'new_test', title_template: 'Đề thi mới đã sẵn sàng 📝', body_template: 'Đề IELTS/TOEIC mới đã được cập nhật.', type: 'system' },
  { name: 'weekly_report', title_template: 'Báo cáo tuần của bạn 📊', body_template: 'Xem tiến độ học tập tuần này của bạn.', type: 'system' },
  { name: 'writing_feedback', title_template: 'Bài viết đã được chấm ✍️', body_template: 'Nhận xét AI cho bài viết của bạn đã sẵn sàng.', type: 'system' },
  { name: 'subscription_expiring', title_template: 'Gói đăng ký sắp hết hạn ⏰', body_template: 'Gói của bạn sẽ hết hạn trong 3 ngày, gia hạn để không gián đoạn.', type: 'system' },
  { name: 'subscription_renewed', title_template: 'Gia hạn thành công ✅', body_template: 'Cảm ơn bạn đã gia hạn gói học.', type: 'system' },
  { name: 'level_up', title_template: 'Bạn đã lên cấp độ mới! 🚀', body_template: 'Chúc mừng, trình độ của bạn vừa được nâng cấp.', type: 'system' },
  { name: 'maintenance', title_template: 'Bảo trì hệ thống 🛠️', body_template: 'Hệ thống bảo trì từ 01:00 đến 02:00 sáng mai.', type: 'system' },
  { name: 'promo_discount', title_template: 'Ưu đãi giảm 30% 🎁', body_template: 'Nâng cấp Pro trong 24 giờ tới để nhận ưu đãi.', type: 'system' },
  { name: 'comeback', title_template: 'Lâu rồi không gặp 💙', body_template: 'Quay lại học để không quên những từ đã thuộc nhé.', type: 'system' },
  { name: 'goal_reached', title_template: 'Hoàn thành mục tiêu hôm nay ✔️', body_template: 'Bạn đã đạt mục tiêu học hôm nay. Giỏi lắm!', type: 'system' }
];

const ERROR_MESSAGES = {
  backend: [
    ['error', 'Lỗi kết nối MySQL: ECONNRESET khi truy vấn user_vocabulary_cards'], ['error', 'JWT hết hạn nhưng client vẫn gửi request /api/review/today'],
    ['warning', 'Rate limit: tài khoản vượt 300 request/phút'], ['error', 'Gemini API trả về 503, đã retry 3 lần'], ['warning', 'Gemini API phản hồi chậm (> 8s)'],
    ['critical', 'Không ghi được vào bảng review_logs: Deadlock found when trying to get lock'], ['info', 'Khởi động lại Backend sau khi triển khai bản mới'],
    ['error', 'Upload audio thất bại: file vượt quá dung lượng cho phép'], ['warning', 'Streak job chạy lâu hơn bình thường'], ['error', 'Expo push thất bại: DeviceNotRegistered'],
    ['info', 'Cron reminder hoàn tất'], ['error', 'Validation lỗi: answers phải là mảng'], ['critical', 'Hết kết nối trong pool Sequelize (acquire timeout)']],
  'ml-service': [
    ['warning', 'Model recall_model.joblib thiếu feature, dùng fallback SM-2'], ['error', 'Timeout gọi /predict sau 2500ms'], ['info', 'Nạp model recall_model.joblib thành công'],
    ['error', 'Không kết nối được MySQL từ ml-server'], ['warning', 'Batch dự đoán chứa 0 thẻ hợp lệ'], ['critical', 'Model bị hỏng, không thể nạp lại'], ['info', 'Healthcheck OK']]
};
const STACKS = ['Error: connect ECONNRESET\n    at TCPConnectWrap.afterConnect (node:net:1555:16)', 'SequelizeDatabaseError: Deadlock found when trying to get lock\n    at Query.run (sequelize/lib/dialects/mysql/query.js:52:25)', 'AppError: Unauthorized\n    at auth.middleware.js:18:11', 'TimeoutError: ml-service did not respond\n    at AbortSignal.onabort (node:internal/abort_controller:318:22)', null, null];

const DICTATION_TEXTS_NOTE = 'transcript lấy từ bài nghe';

const NOTE_TITLES = ['Ghi nhớ cách dùng', 'Lỗi hay sai', 'Từ cần ôn lại', 'Cấu trúc hay', 'Mẹo luyện nghe', 'Ý tưởng bài viết', 'Collocation', 'Phrasal verb mới', 'Câu mẫu IELTS', 'Việc cần luyện'];
const NOTE_BODIES = ['Dùng "have been + V-ing" cho hành động kéo dài đến hiện tại.', 'Nhớ phân biệt "affect" (động từ) và "effect" (danh từ).', 'Nghe chép: chú ý âm cuối -s, -ed hay bị bỏ sót.', 'Mở bài IELTS Task 2: paraphrase đề, nêu quan điểm rõ ràng.', '"look forward to" + V-ing, không dùng động từ nguyên mẫu.', 'Ôn 20 từ chủ đề Business trước thứ Sáu.', 'Câu điều kiện loại 2: If + quá khứ đơn, would + V.', 'make a decision (không phải do a decision).', 'Đọc nhanh: tìm từ khóa trong câu hỏi trước khi đọc đoạn văn.', 'Luyện viết 150 từ mỗi ngày về chủ đề tự chọn.'];
const NOTE_COLORS = ['yellow', 'blue', 'green', 'pink', 'purple', 'orange'];
const FEEDBACK = {
  overall: ['Bài viết có bố cục rõ ràng, ý tưởng liên quan đến đề bài. Cần phát triển ý sâu hơn.', 'Bài làm khá tốt, từ vựng đa dạng, tuy nhiên còn vài lỗi ngữ pháp cơ bản.', 'Bài viết còn ngắn và thiếu ví dụ cụ thể. Hãy bổ sung thêm chi tiết.', 'Rất tốt! Bài viết mạch lạc, dùng từ nối hợp lý và ít lỗi.', 'Ý tưởng chưa rõ ràng, cần cải thiện cách liên kết giữa các đoạn.'],
  grammar: ['Lỗi chia động từ: "she go" → "she goes".', 'Thiếu mạo từ trước danh từ đếm được số ít.', 'Dùng sai giới từ: "in Monday" → "on Monday".', 'Sai thì: dùng hiện tại đơn thay vì quá khứ đơn.', 'Câu thiếu chủ ngữ.', 'Lỗi số nhiều: "many person" → "many people".'],
  vocab: ['Thay "good" bằng "beneficial" hoặc "valuable".', 'Dùng "significantly" thay cho "very much".', 'Thay "big problem" bằng "major issue".', 'Dùng "in addition" thay vì lặp lại "and".', 'Thay "a lot of" bằng "numerous" trong văn viết trang trọng.']
};
const ESSAY_SENTENCES = ['In my opinion, this is an important issue in modern society.', 'There are several reasons why I hold this view.', 'Firstly, it brings many benefits to individuals and communities.', 'For example, people can save time and money in their daily lives.', 'However, there are also some disadvantages that we should not ignore.', 'Secondly, young people are strongly influenced by what they see every day.', 'On the other hand, some people argue that the opposite is true.', 'In addition, the government should play a bigger role in solving this problem.', 'To conclude, I believe that the advantages outweigh the disadvantages.', 'I usually spend my free time reading books and meeting friends.', 'Last summer I visited my grandparents in the countryside and enjoyed the fresh air.', 'My favourite thing about it is the friendly atmosphere.'];

module.exports = {
  LEVELS, LETTERS, READING_TOPICS, LISTENING_SCENARIOS, PLANS, NOTIFICATION_TEMPLATES, ERROR_MESSAGES, STACKS, NOTE_TITLES, NOTE_BODIES, NOTE_COLORS, FEEDBACK, ESSAY_SENTENCES, DICTATION_TEXTS_NOTE,
  makeReading, makeListening, makeWritingPrompts, makeGrammar, makePlacementBank, buildQuestion
};
