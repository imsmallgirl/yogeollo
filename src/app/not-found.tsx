import Link from "next/link";
export default function NotFound() { return <main id="main" className="mx-auto max-w-6xl px-6 py-24"><h1 className="text-3xl font-bold">페이지를 찾을 수 없어요</h1><p className="my-5 text-muted-foreground">주소를 확인하거나 홈으로 돌아가 주세요.</p><Link href="/" className="font-semibold text-primary underline">홈으로 돌아가기</Link></main>; }
