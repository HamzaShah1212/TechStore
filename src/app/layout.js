import "./globals.css";
import LogoutButton from "./Components/LogoutButton";
import StoreSearch from "./Components/StoreSearch";
import MobileMenu from "./Components/MobileMenu";

export const metadata = {
  title: "MobiKiosk | Modern mobile store",
  description: "Shop premium smartphones from Apple, Samsung, Google and Nothing with trusted advice, fast delivery and easy returns.",
  keywords: ["mobile store", "buy smartphones", "iPhone", "Samsung Galaxy", "Google Pixel", "Nothing Phone"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "MobiKiosk | Technology, beautifully chosen",
    description: "Premium smartphones, honest advice and delivery that keeps up.",
    type: "website",
    siteName: "MobiKiosk",
  },
  twitter: { card: "summary_large_image", title: "MobiKiosk | Modern mobile store", description: "Premium smartphones, honestly chosen." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-full">
        {children}
        <StoreSearch />
        <MobileMenu />
        <LogoutButton />
      </body>
    </html>
  );
}
