import { redirect } from 'next/navigation';

export default function Home() {
  // Ana sayfadan doğrudan bot kontrol paneline yönlendir
  redirect('/dashboard/bot-control');
}
