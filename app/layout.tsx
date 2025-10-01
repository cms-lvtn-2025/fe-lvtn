import type { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { SemesterProvider } from "@/lib/contexts/semester-context"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Luận văn - ĐH Bách Khoa TP.HCM",
  description: "Hệ thống quản lý luận văn tốt nghiệp",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${robotoMono.variable} antialiased`}>
      <body className="font-sans bg-background">
        <AuthProvider>
          <SemesterProvider>{children}</SemesterProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
