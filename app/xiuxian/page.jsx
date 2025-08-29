// 不要快取、不要預產
export const revalidate = 0;
export const dynamic = "force-dynamic";

// 直接引入 client component（不要用 next/dynamic）
import ClientPage from "./ClientPage";

export default function Page() {
  return <ClientPage />;
}
