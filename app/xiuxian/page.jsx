// 不要預產、不要快取
export const revalidate = 0;
export const dynamic = "force-dynamic";

// 只負責載入 Client 元件（千萬別在這裡用任何 hook）
import ClientPage from "./ClientPage";

export default function Page() {
  return <ClientPage />;
}
