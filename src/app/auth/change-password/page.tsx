// app/auth/change-password/page.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Sprout } from "lucide-react";
import Link from "next/link";
import {
  Form, FormControl, FormField, FormItem, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { changePassword } from "@/actions/changePassword";
import { FormError } from "@/components/form/form-error";
import { FormSuccess } from "@/components/form/form-success";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your temporary password"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      // .regex(/[A-Z]/, "Needs an uppercase letter")
      .regex(/[a-z]/, "Needs a lowercase letter")
      // .regex(/[0-9]/, "Needs a number")
      .regex(/[^A-Za-z0-9]/, "Needs a special character"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const requirements = [
  { label: "At least 8 characters",     test: (v: string) => v.length >= 8 },
  // { label: "One uppercase letter",       test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter",       test: (v: string) => /[a-z]/.test(v) },
  // { label: "One number",                 test: (v: string) => /[0-9]/.test(v) },
  { label: "One special character",      test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export default function ChangePasswordPage() {
  const [showCurrent, setShowCurrent]   = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [error, setError]     = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = form.watch("newPassword") ?? "";

  function onSubmit(data: FormValues) {
    setError(undefined);
    setSuccess(undefined);
    startTransition(async () => {
      const result = await changePassword(data);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.success);
      // Give user a moment to read success, then redirect
      setTimeout(() => { window.location.href = "/dashboard/startup"; }, 1500);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 bg-[#1A362B] rounded-sm flex items-center justify-center
                            transform group-hover:rotate-3 transition-transform duration-300">
              <div className="w-7 h-7 border-2 border-[#F9F7F2] rotate-45" />
            </div>
            <div className="text-left">
              <span className="font-serif text-2xl font-bold text-[#1A362B] block leading-tight">
                VentureHub
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#1A362B]/40 font-bold">
                Nurturing Growth
              </span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl shadow-[#1A362B]/10
                        border border-[#EFEBE3] p-8 sm:p-10">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200
                            flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-amber-600" />
            </div>
            <h1 className="font-serif text-3xl text-[#1A362B] mb-2">Set Your Password</h1>
            <p className="text-sm text-[#1A362B]/60 leading-relaxed">
              For security, you must change your temporary password before continuing.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-[#1A362B]/10" />
            <Sprout className="w-4 h-4 text-[#1A362B]/30" />
            <div className="flex-1 h-px bg-[#1A362B]/10" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* Current (temp) password */}
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <label className="block text-sm font-medium text-[#1A362B]/80 mb-2">
                      Temporary Password
                    </label>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showCurrent ? "text" : "password"}
                          placeholder="Enter the password from your email"
                          className="h-12 bg-white/50 border-[#1A362B]/20 rounded-lg pr-12
                                     focus:ring-2 focus:ring-[#1A362B] focus:border-transparent
                                     placeholder:text-[#1A362B]/30 text-[#1A362B]"
                          disabled={isPending}
                        />
                      </FormControl>
                      <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                                   text-[#1A362B]/40 hover:text-[#1A362B] transition-colors">
                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <FormMessage className="text-sm text-red-500 mt-1" />
                  </FormItem>
                )}
              />

              {/* New password */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <label className="block text-sm font-medium text-[#1A362B]/80 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showNew ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="h-12 bg-white/50 border-[#1A362B]/20 rounded-lg pr-12
                                     focus:ring-2 focus:ring-[#1A362B] focus:border-transparent
                                     placeholder:text-[#1A362B]/30 text-[#1A362B]"
                          disabled={isPending}
                        />
                      </FormControl>
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                                   text-[#1A362B]/40 hover:text-[#1A362B] transition-colors">
                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <FormMessage className="text-sm text-red-500 mt-1" />

                    {/* Password strength checklist */}
                    {newPasswordValue.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-1.5">
                        {requirements.map((req) => {
                          const met = req.test(newPasswordValue);
                          return (
                            <div key={req.label} className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center
                                               text-[10px] font-bold flex-shrink-0 transition-colors ${
                                met
                                  ? "bg-emerald-100 text-emerald-600"
                                  : "bg-[#EFEBE3] text-[#1A362B]/30"
                              }`}>
                                {met ? "✓" : "·"}
                              </span>
                              <span className={`text-xs transition-colors ${
                                met ? "text-emerald-600" : "text-[#1A362B]/40"
                              }`}>
                                {req.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Confirm password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <label className="block text-sm font-medium text-[#1A362B]/80 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <FormControl>
                        <Input
                          {...field}
                          type={showConfirm ? "text" : "password"}
                          placeholder="Re-enter your new password"
                          className="h-12 bg-white/50 border-[#1A362B]/20 rounded-lg pr-12
                                     focus:ring-2 focus:ring-[#1A362B] focus:border-transparent
                                     placeholder:text-[#1A362B]/30 text-[#1A362B]"
                          disabled={isPending}
                        />
                      </FormControl>
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2
                                   text-[#1A362B]/40 hover:text-[#1A362B] transition-colors">
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <FormMessage className="text-sm text-red-500 mt-1" />
                  </FormItem>
                )}
              />

              <FormError   message={error}   />
              <FormSuccess message={success} />

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-[#1A362B] text-white rounded-lg font-bold
                           uppercase text-xs tracking-[0.2em] hover:bg-[#1A362B]/90
                           transition-all duration-300 disabled:opacity-50
                           disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg"
                      fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Updating password…
                  </span>
                ) : (
                  "Set New Password"
                )}
              </button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}