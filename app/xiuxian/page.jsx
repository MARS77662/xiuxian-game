// app/xiuxian/page.jsx
import ClientPage from "./ClientPage";

export const revalidate = 0;            // 不快取
export const dynamic = "force-dynamic"; // 不中斷預先產生

export default function Page() {
  return <ClientPage />;
}
