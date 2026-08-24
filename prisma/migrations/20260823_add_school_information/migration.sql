-- CreateTable: school_information
-- Single-row configuration table for school-wide settings.
-- The unique constraint on the constant column (value = 'X') enforces exactly one row.

CREATE TABLE "school_information" (
    "id"                       TEXT NOT NULL DEFAULT 'school-config',
    "school_name"              TEXT NOT NULL DEFAULT '',
    "short_name"               TEXT,
    "school_code"              TEXT,
    "registration_number"      TEXT,
    "address"                  TEXT,
    "municipality"             TEXT,
    "district"                 TEXT,
    "province"                 TEXT,
    "country"                  TEXT NOT NULL DEFAULT 'Nepal',
    "phone"                    TEXT,
    "alternative_phone"        TEXT,
    "email"                    TEXT,
    "website"                  TEXT,
    "logo_url"                 TEXT,
    "favicon_url"              TEXT,
    "principal_name"           TEXT,
    "principal_contact"        TEXT,
    "principal_signature_url"  TEXT,
    "school_stamp_url"         TEXT,
    "header_text"              TEXT,
    "footer_text"              TEXT,
    "report_card_header"       TEXT,
    "marksheet_header"         TEXT,
    "certificate_header"       TEXT,
    "established_year"         INTEGER,
    "school_type"              TEXT,
    "management_type"          TEXT,
    "abbrev"                   TEXT,
    "address_full"             TEXT,
    "email_alt"                TEXT,
    "updated_by"               TEXT,
    "created_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_information_pkey" PRIMARY KEY ("id")
);

-- Seed initial row from existing hardcoded values
INSERT INTO "school_information" (
    "id",
    "school_name",
    "short_name",
    "abbrev",
    "address",
    "address_full",
    "phone",
    "email",
    "email_alt",
    "website",
    "logo_url",
    "country",
    "created_at",
    "updated_at"
) VALUES (
    'school-config',
    'Sanskar Vatika School',
    'Sanskar Vatika School',
    'SVS',
    'Dhalpa, Phayekhanagar, Kirtipur, Kathmandu, Nepal',
    'Dhalpa, Phayekhanagar, Kirtipur, Kathmandu, Nepal',
    '9802009272',
    'sanskarvschool@gmail.com',
    'sanskarvschool@gmail.com',
    'www.svskirtipur.edu.np',
    'https://dashboard.svskirtipur.edu.np/logo.png',
    'Nepal',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;
