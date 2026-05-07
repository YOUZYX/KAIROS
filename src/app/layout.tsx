import "./globals.css";

export const metadata = {
  title: "KAIROS Club",
  description: "KAIROS Club — Join form",
  icons: {
    icon: "/assets/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Caveat:wght@400;700&family=Rock+Salt&family=Shadows+Into+Light&family=Special+Elite&family=Amatic+SC:wght@400;700&family=Reem+Kufi:wght@400;700&family=Cairo:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
