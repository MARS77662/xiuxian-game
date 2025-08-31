// app/xiuxian/layout.jsx (Server Component)
import "./userinfo.css";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import ClientProviders from "./ClientProviders";

export default function XiuxianLayout({ children }) {
  return (
    <ClientProviders>
      {children}
    </ClientProviders>
  );
}
