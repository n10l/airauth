'use client';

import { motion } from 'framer-motion';
import { Shield, Check, Copy, ArrowRight, AlertTriangle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function MultiFactorPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    setup: `// app/api/auth/[...nextauth]/route.ts
import NextAuth from "@airauth/next"
import GoogleProvider from "@airauth/next/providers/google"
import { PrismaAdapter } from "@airauth/next/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      // Include MFA status in session
      session.user.mfaEnabled = user.mfaEnabled
      session.user.backupCodes = user.backupCodes?.length > 0
      return session
    },
  },
})`,

    mfaSetup: `// components/MFASetup.tsx
"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

export function MFASetup() {
  const [secret, setSecret] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [step, setStep] = useState<"generate" | "verify" | "backup">("generate")

  const generateSecret = async () => {
    const response = await fetch("/api/mfa/generate", {
      method: "POST",
    })
    const data = await response.json()
    setSecret(data.secret)
    setQrCode(data.qrCode)
    setStep("verify")
  }

  const verifyAndEnable = async () => {
    const response = await fetch("/api/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        token: verificationCode,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      setBackupCodes(data.backupCodes)
      setStep("backup")
      toast.success("MFA enabled successfully!")
    } else {
      toast.error("Invalid verification code")
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      {step === "generate" && (
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Enable Two-Factor Authentication</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add an extra layer of security to your account
          </p>
          <button
            onClick={generateSecret}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Get Started
          </button>
        </div>
      )}

      {step === "verify" && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Scan QR Code</h3>
          <div className="flex justify-center mb-4">
            <QRCodeSVG value={qrCode} size={200} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Scan this QR code with your authenticator app, then enter the 6-digit code below.
          </p>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="w-full p-2 border rounded-lg mb-4"
            maxLength={6}
          />
          <button
            onClick={verifyAndEnable}
            disabled={verificationCode.length !== 6}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Verify & Enable
          </button>
        </div>
      )}

      {step === "backup" && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Save Backup Codes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Store these codes safely. You can use them to access your account if you lose your phone.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {backupCodes.map((code, index) => (
              <div
                key={index}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-center font-mono text-sm"
              >
                {code}
              </div>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            I've Saved These Codes
          </button>
        </div>
      )}
    </div>
  )
}`,

    apiGenerate: `// app/api/mfa/generate/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { authenticator } from "otplib"
import { PrismaClient } from "@prisma/client"
import QRCode from "qrcode"

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Generate secret
    const secret = authenticator.generateSecret()
    
    // Create service name and account name for QR code
    const serviceName = "@airauth/next App"
    const accountName = session.user.email
    
    // Generate OTP URL
    const otpUrl = authenticator.keyuri(accountName, serviceName, secret)
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpUrl)
    
    // Store temporary secret (don't enable MFA yet)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mfaSecret: secret }
    })

    return NextResponse.json({
      secret,
      qrCode,
      backupCodes: []
    })
  } catch (error) {
    console.error("MFA generation error:", error)
    return NextResponse.json({ error: "Failed to generate MFA secret" }, { status: 500 })
  }
}`,

    apiVerify: `// app/api/mfa/verify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { authenticator } from "otplib"
import { PrismaClient } from "@prisma/client"
import { randomBytes } from "crypto"

const prisma = new PrismaClient()

function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => {
    return randomBytes(4).toString('hex').toUpperCase()
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const { secret, token } = await req.json()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Verify the token
    const isValid = authenticator.verify({ token, secret })
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 })
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes()
    
    // Enable MFA for the user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaEnabled: true,
        mfaSecret: secret,
        backupCodes: {
          create: backupCodes.map(code => ({ code }))
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      backupCodes 
    })
  } catch (error) {
    console.error("MFA verification error:", error)
    return NextResponse.json({ error: "Failed to verify MFA" }, { status: 500 })
  }
}`,

    middleware: `// middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"

export async function middleware(request: NextRequest) {
  const session = await auth()
  
  // Check if user needs MFA verification
  if (session?.user && session.user.mfaEnabled) {
    const mfaVerified = request.cookies.get('mfa-verified')?.value === 'true'
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
    const isMfaRoute = request.nextUrl.pathname.startsWith('/auth/mfa')
    
    if (isProtectedRoute && !mfaVerified && !isMfaRoute) {
      return NextResponse.redirect(new URL('/auth/mfa', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}`,

    mfaLogin: `// app/auth/mfa/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function MFAPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [useBackupCode, setUseBackupCode] = useState(false)
  const router = useRouter()

  const verifyMFA = async () => {
    if (code.length !== 6) return
    
    setLoading(true)
    try {
      const response = await fetch("/api/mfa/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          isBackupCode: useBackupCode
        }),
      })

      if (response.ok) {
        toast.success("Authentication successful!")
        router.push("/dashboard")
      } else {
        toast.error("Invalid code")
        setCode("")
      }
    } catch (error) {
      toast.error("Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Two-Factor Authentication</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {useBackupCode 
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"
            }
          </p>
        </div>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder={useBackupCode ? "Backup code" : "000000"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full text-center text-2xl tracking-widest p-4 border rounded-lg"
            maxLength={useBackupCode ? 8 : 6}
            autoComplete="off"
          />
          
          <button
            onClick={verifyMFA}
            disabled={loading || code.length < (useBackupCode ? 8 : 6)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
          
          <button
            onClick={() => {
              setUseBackupCode(!useBackupCode)
              setCode("")
            }}
            className="w-full text-blue-600 hover:text-blue-700"
          >
            {useBackupCode ? "Use authenticator app" : "Use backup code"}
          </button>
        </div>
      </div>
    </div>
  )
}`,
  };

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-red-600 to-pink-600 rounded-xl'>
            <Shield className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>Multi-Factor Auth</h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Implement Time-based One-Time Password (TOTP) authentication to add an extra layer of
          security to your application.
        </p>
      </motion.div>

      {/* Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Overview</h2>
        <div className='prose prose-slate dark:prose-invert max-w-none'>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            Multi-Factor Authentication (MFA) adds an essential security layer by requiring users to
            provide a second form of verification beyond their password. This implementation uses
            Time-based One-Time Passwords (TOTP) compatible with popular authenticator apps like
            Google Authenticator, Authy, and 1Password.
          </p>
          <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5' />
              <div>
                <h4 className='font-medium text-amber-900 dark:text-amber-400 mb-1'>
                  Security Notice
                </h4>
                <p className='text-sm text-amber-800 dark:text-amber-300'>
                  Always use HTTPS in production and store MFA secrets securely. Consider
                  implementing rate limiting on MFA verification endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Prerequisites */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Prerequisites
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>Database Setup</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              Database adapter configured with user MFA fields
            </p>
          </div>
          <div className='p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>Dependencies</h3>
            <p className='text-sm text-slate-600 dark:text-slate-400'>
              otplib, qrcode, qrcode.react packages
            </p>
          </div>
        </div>
      </motion.section>

      {/* Database Schema */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Database Schema
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Add these fields to your User model for MFA support:
        </p>
        <div className='relative'>
          <button
            onClick={() =>
              copyCode(
                `// schema.prisma - Add to User model
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  // ... other fields
  
  // MFA fields
  mfaEnabled    Boolean   @default(false)
  mfaSecret     String?
  backupCodes   BackupCode[]
}

model BackupCode {
  id        String   @id @default(cuid())
  code      String
  used      Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}`,
                'schema'
              )
            }
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'schema' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='prisma' style={vscDarkPlus} className='rounded-lg'>
            {`// schema.prisma - Add to User model
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  // ... other fields
  
  // MFA fields
  mfaEnabled    Boolean   @default(false)
  mfaSecret     String?
  backupCodes   BackupCode[]
}

model BackupCode {
  id        String   @id @default(cuid())
  code      String
  used      Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}`}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Authentication Setup */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Authentication Configuration
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Configure NextAuth to include MFA status in the session:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.setup, 'setup')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'setup' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.setup}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* MFA Setup Component */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          MFA Setup Component
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a React component for users to enable MFA on their accounts:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.mfaSetup, 'mfaSetup')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'mfaSetup' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.mfaSetup}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* API Routes */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>API Routes</h2>

        <div className='space-y-8'>
          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-3'>
              Generate MFA Secret
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              API route to generate TOTP secret and QR code:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.apiGenerate, 'apiGenerate')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'apiGenerate' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.apiGenerate}
              </SyntaxHighlighter>
            </div>
          </div>

          <div>
            <h3 className='text-xl font-semibold text-slate-900 dark:text-white mb-3'>
              Verify and Enable MFA
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-4'>
              API route to verify TOTP token and enable MFA:
            </p>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.apiVerify, 'apiVerify')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'apiVerify' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.apiVerify}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Middleware Protection */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Middleware Protection
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Protect routes that require MFA verification:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.middleware, 'middleware')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'middleware' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.middleware}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* MFA Login Page */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          MFA Login Page
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Create a page for users to enter their TOTP code during login:
        </p>
        <div className='relative'>
          <button
            onClick={() => copyCode(codeExamples.mfaLogin, 'mfaLogin')}
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'mfaLogin' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
            {codeExamples.mfaLogin}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Security Best Practices */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Security Best Practices
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <h3 className='font-semibold text-red-900 dark:text-red-400 mb-3'>Critical Security</h3>
            <ul className='space-y-2 text-sm text-red-800 dark:text-red-300'>
              <li>• Always use HTTPS in production</li>
              <li>• Store MFA secrets encrypted at rest</li>
              <li>• Implement rate limiting on verification endpoints</li>
              <li>• Log MFA events for security monitoring</li>
            </ul>
          </div>

          <div className='p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-3'>User Experience</h3>
            <ul className='space-y-2 text-sm text-blue-800 dark:text-blue-300'>
              <li>• Provide clear setup instructions</li>
              <li>• Generate and show backup codes</li>
              <li>• Allow recovery without MFA device</li>
              <li>• Test with multiple authenticator apps</li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Required Dependencies */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Required Dependencies
        </h2>
        <p className='text-slate-600 dark:text-slate-400 mb-4'>
          Install these packages for MFA functionality:
        </p>
        <div className='relative'>
          <button
            onClick={() =>
              copyCode(
                `npm install otplib qrcode qrcode.react sonner
# or
yarn add otplib qrcode qrcode.react sonner
# or
pnpm add otplib qrcode qrcode.react sonner`,
                'dependencies'
              )
            }
            className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
          >
            {copiedCode === 'dependencies' ? (
              <Check className='w-4 h-4 text-green-400' />
            ) : (
              <Copy className='w-4 h-4 text-slate-400' />
            )}
          </button>
          <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
            {`npm install otplib qrcode qrcode.react sonner
# or
yarn add otplib qrcode qrcode.react sonner
# or
pnpm add otplib qrcode qrcode.react sonner`}
          </SyntaxHighlighter>
        </div>
      </motion.section>

      {/* Related Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Related Documentation
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/installation'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Installation</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Get started with @airauth/next
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/configuration'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Configuration</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Configure your authentication
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
