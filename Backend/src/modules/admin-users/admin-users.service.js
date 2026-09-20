const adminUsersRepository = require('./admin-users.Repository');
const AppError = require('../../common/utils/AppError');
const { toUserListItemDto, toUserDetailDto } = require('./admin-users.dtos');

const PAGE_SIZE = 20;

function assertAdmin(requester) {
  if (!requester || requester.role !== 'admin') {
    throw new AppError('Chỉ admin mới có quyền thao tác này', 403);
  }
}

async function getUsers(requester, { search, status, page }) {
  assertAdmin(requester);

  const parsedPage = page ? Number(page) : 1;
  const { users, total } = await adminUsersRepository.findUsers({
    search,
    status,
    page: parsedPage,
    pageSize: PAGE_SIZE
  });

  return { users: users.map(toUserListItemDto), total, page: parsedPage };
}

async function getUserDetail(requester, userId) {
  assertAdmin(requester);

  const user = await adminUsersRepository.findUserById(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }
  return toUserDetailDto(user);
}

async function updateUserStatus(requester, userId, isActive) {
  assertAdmin(requester);

  const user = await adminUsersRepository.findUserById(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  // Chặn admin tự khoá chính mình — tránh tình huống khoá hết đường vào hệ thống.
  if (Number(userId) === Number(requester.id) && isActive === false) {
    throw new AppError('Không thể tự khoá tài khoản của chính mình', 400);
  }

  const updatedUser = await adminUsersRepository.updateUserStatus(userId, isActive);

  await adminUsersRepository.createAuditLog({
    actor_id: requester.id,
    action: 'user.status.update',
    target_type: 'user',
    target_id: userId,
    detail: { from: user.is_active, to: isActive }
  });

  return toUserDetailDto(updatedUser);
}

async function getUserProgress(requester, userId) {
  assertAdmin(requester);

  const user = await adminUsersRepository.findUserById(userId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 404);
  }

  const [vocabulary, reading, listening] = await Promise.all([
    adminUsersRepository.getVocabularyProgress(userId),
    adminUsersRepository.getReadingProgress(userId),
    adminUsersRepository.getListeningProgress(userId)
  ]);

  return {
    user_id: user.id,
    full_name: user.full_name,
    level_current: user.level_current,
    vocabulary,
    reading,
    listening
  };
}

module.exports = {
  getUsers,
  getUserDetail,
  updateUserStatus,
  getUserProgress
};
