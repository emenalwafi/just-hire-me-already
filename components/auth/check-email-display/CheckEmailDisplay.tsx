import React from "react";
import Image from "next/image";

/**
 * Props for the `CheckEmailDisplay` component.
 */
interface CheckEmailDisplayProps {
  /** The email address the verification/login link was sent to. */
  email: string;
  /**
   * The context in which the email was sent ('register' or 'login').
   * This affects the wording displayed to the user.
   */
  context: "register" | "login";
  /**
   * The validity duration of the email link, in minutes.
   * Defaults to 30.
   */
  expiryMinutes?: number;
  /**
   * The path to the illustration image to display.
   * Should be relative to the `/public` folder.
   * Defaults to "/email-sent.svg".
   */
  imageUrl?: string;
}

/**
 * A component designed to inform the user to check their email
 * after requesting a magic link for registration or login.
 * Displays the target email address, link expiry time, and an illustration.
 *
 * @param {CheckEmailDisplayProps} props - The component props.
 * @param {string} props.email - The email address the link was sent to.
 * @param {"register" | "login"} props.context - The context ('register' or 'login') for text adjustment.
 * @param {number} [props.expiryMinutes=30] - Link validity duration in minutes.
 * @param {string} [props.imageUrl="/email-sent.svg"] - Path to the illustration image.
 * @returns {React.ReactElement} The rendered Check Email display component.
 */
const CheckEmailDisplay: React.FC<CheckEmailDisplayProps> = ({
  email,
  context,
  expiryMinutes = 30,
  imageUrl = "/email-sent.svg",
}) => {
  const linkTypeText = context === "register" ? "register" : "login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-20 p-4">
      <div
        data-state={`${
          context === "register" ? "Register" : "Login"
        } - Check Email`}
        className="w-full max-w-md rounded-lg bg-neutral-10 p-6 shadow-[0px_4px_8px_0px_rgba(0,0,0,0.10)] sm:p-8 md:w-[500px] md:p-10 inline-flex flex-col justify-center items-center gap-8 font-sans"
      >
        <div className="self-stretch flex flex-col justify-center items-center gap-6">
          <div className="w-full flex flex-col justify-start items-start gap-1">
            <div className="self-stretch flex flex-col justify-start items-start gap-2">
              <h1 className="self-stretch text-center text-neutral-90 text-heading-base font-bold">
                Periksa Email Anda
              </h1>
              <p className="self-stretch text-center text-neutral-90 text-sm">
                Kami sudah mengirimkan link {linkTypeText} ke{" "}
                <span className="font-bold">{email}</span> yang berlaku dalam{" "}
                <span className="font-bold">{expiryMinutes} menit</span>.
              </p>
            </div>
          </div>
          <div className="relative w-40 h-40">
            <Image
              src={imageUrl}
              alt="Email sent illustration"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckEmailDisplay;
