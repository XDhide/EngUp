import { Redirect } from 'expo-router';

// Mặc định điều hướng về trang login
export default function Index() {
  return <Redirect href="/login" />;
}
