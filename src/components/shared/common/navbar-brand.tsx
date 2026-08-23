'use client';

import React from 'react';
import Link from 'next/link';
import { useSchoolInformation } from '@/hooks/use-school-information';
import { SCHOOL_CONFIG } from '@/constants';

interface NavbarBrandProps {
  dashboardHref: string;
}

export function NavbarBrand({ dashboardHref }: NavbarBrandProps) {
  const { school } = useSchoolInformation();
  const displayName = SCHOOL_CONFIG.nameShort || SCHOOL_CONFIG.name;
  const logo = school?.logoUrl || SCHOOL_CONFIG.logo;

  return (
    <Link href={dashboardHref} className="mr-6 flex items-center gap-2 font-semibold min-w-0">
      {logo && (
        <img
          src={logo}
          alt={`${displayName} Logo`}
          className="h-8 w-auto object-contain rounded-md flex-shrink-0"
        />
      )}
      <span className="truncate max-w-[180px] md:max-w-xs text-sm">{displayName}</span>
    </Link>
  );
}
