// components/auth/MagicLinkEmail.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link"; // Use Link for the main action button

interface MagicLinkEmailProps {
  /** Callback function triggered when the login button is clicked. */
  onLoginClick: () => void;
  /** The base URL of the site, used in the text. Defaults to www.rakamin.com */
  siteUrl?: string;
  /** Company Name. Defaults to PT. Rakamin Kolektif Madani*/
  companyName?: string;
  /** Company Address. Defaults to Menara Caraka address */
  companyAddress?: string;
  /** Logo URL. Defaults to placeholder */
  logoUrl?: string;
}

/**
 * A component representing the content/template for a magic login link email.
 * This would typically be rendered to HTML on the server and sent via email.
 */
const MagicLinkEmail: React.FC<MagicLinkEmailProps> = ({
  onLoginClick,
  siteUrl = "www.rakamin.com",
  companyName = "PT. Rakamin Kolektif Madani",
  companyAddress = "Menara Caraka - Jl. Mega Kuningan Barat, Kuningan, Kecamatan Setiabudi, Jakarta Selatan, DKI Jakarta 12950",
  logoUrl = "/rakamin-logo.png",
}) => {
  const currentYear = new Date().getFullYear();

  return (
    // Outer container mimicking email client constraints (fixed width, centered)
    // Background color applied here simulates the email body background
    <div className="max-w-full w-[640px] bg-neutral-10 inline-flex flex-col justify-start items-start overflow-hidden mx-auto font-sans shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)]">
      {" "}
      {/* Added border for visual separation */}
      {/* Header Section */}
      <div className="self-stretch px-8 pt-6 bg-neutral-10 inline-flex justify-center items-center gap-4">
        <div className="flex-1 inline-flex flex-col justify-center items-center gap-7 overflow-hidden">
          <Image
            src={logoUrl}
            alt={`${companyName} Logo`}
            width={112}
            height={64}
          />
          <h1 className="self-stretch text-center text-neutral-100 text-heading-lg font-bold">
            Masuk ke Rakamin
          </h1>
          <div className="self-stretch h-px bg-[#F1F3F4]" />{" "}
          {/* Changed color */}
          <p className="self-stretch text-neutral-90 text-xl text-left">
            {" "}
            {/* Added text-left */}
            Hai,
            <br />
            Berikut adalah <strong className="font-bold">
              link masuk
            </strong>{" "}
            yang kamu request dari{" "}
            <span className="text-[#007DFE]">{siteUrl}</span>
          </p>
        </div>
      </div>
      {/* Action Section */}
      <div className="self-stretch px-8 py-6 bg-neutral-10 inline-flex justify-start items-center gap-4">
        <div className="flex-1 inline-flex flex-col justify-center items-center gap-4 overflow-hidden">
          <div className="self-stretch h-px bg-[#F1F3F4]" />{" "}
          <button
            type="button"
            onClick={onLoginClick} // Call the passed-in function
            className="cursor-pointer px-6 py-2 bg-primary-main rounded-lg inline-flex justify-center items-center gap-2 overflow-hidden hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-1 transition-colors cursor-pointer" // Added cursor-pointer
          >
            <span className="text-center justify-start text-neutral-10 text-base font-bold">
              Masuk ke Rakamin
            </span>
          </button>
          <p className="self-stretch text-center text-neutral-60 text-base">
            Untuk keamanan, link hanya dapat diakses dalam 30 menit. Jika kamu
            tidak ada permintaan untuk login melalui link, abaikan pesan ini.
          </p>
        </div>
      </div>
      {/* Footer Section */}
      <div className="self-stretch p-8 bg-neutral-20 inline-flex justify-end items-start gap-4">
        <div className="flex-1 inline-flex flex-col justify-center items-start gap-2 overflow-hidden">
          <div className="self-stretch text-neutral-100 text-lg font-bold">
            {companyName}
          </div>
          <div className="w-full max-w-[576px] text-neutral-70 text-base">
            {" "}
            {/* Used max-w instead of fixed w */}
            {companyAddress}
          </div>
          <div className="self-stretch text-neutral-60 text-[10px]">
            @ Rakamin {currentYear}. All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagicLinkEmail;
