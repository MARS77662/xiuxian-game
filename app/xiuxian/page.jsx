import dynamic from "next/dynamic";

// 不要快取、不要預先產生
export const revalidate = 0;
export const dynamic = "force-dynamic";

// 用 next/dynamic 關掉 SSR
const Client = dynamic(() => import("./ClientPage"), { ssr: false });

export default function Page() {
  return <Client />;
}
