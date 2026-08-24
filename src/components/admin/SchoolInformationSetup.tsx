"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Building2,
  MapPin,
  Phone,
  UserRound,
  ImagePlus,
  Save,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useSchoolInformation,
  type SchoolInfo,
} from "@/hooks/use-school-information";
import SanskarLoader from "@/components/shared/SanskarLoader";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clean = (v: string): string | null => {
  const t = v.trim();
  return t === "" ? null : t;
};

const toFormString = (v: string | number | null | undefined): string =>
  v === null || v === undefined ? "" : String(v);

type FormValues = Record<string, string>;

function schoolToFormValues(school: SchoolInfo): FormValues {
  return {
    schoolName: toFormString(school.schoolName),
    shortName: toFormString(school.shortName),
    abbrev: toFormString(school.abbrev),
    schoolCode: toFormString(school.schoolCode),
    registrationNumber: toFormString(school.registrationNumber),
    schoolType: toFormString(school.schoolType),
    managementType: toFormString(school.managementType),
    establishedYear: toFormString(school.establishedYear),
    address: toFormString(school.address),
    addressFull: toFormString(school.addressFull),
    municipality: toFormString(school.municipality),
    district: toFormString(school.district),
    province: toFormString(school.province),
    country: toFormString(school.country) || "Nepal",
    phone: toFormString(school.phone),
    alternativePhone: toFormString(school.alternativePhone),
    email: toFormString(school.email),
    emailAlt: toFormString(school.emailAlt),
    website: toFormString(school.website),
    principalName: toFormString(school.principalName),
    principalContact: toFormString(school.principalContact),
    headerText: toFormString(school.headerText),
    footerText: toFormString(school.footerText),
    reportCardHeader: toFormString(school.reportCardHeader),
    marksheetHeader: toFormString(school.marksheetHeader),
    certificateHeader: toFormString(school.certificateHeader),
  };
}

// ─── Field primitives ─────────────────────────────────────────────────────────
function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-foreground/70">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Image uploader ───────────────────────────────────────────────────────────
const ACCEPTED_IMAGES = "image/png,image/jpeg,image/webp,image/svg+xml";

function ImageField({
  label,
  hint,
  url,
  kind,
  aspect,
}: {
  label: string;
  hint?: string;
  url: string | null;
  kind: "logo" | "signature" | "stamp" | "favicon";
  aspect?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, removeImage, isUploading, isRemoving } =
    useSchoolInformation();

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    try {
      await uploadImage({ file, type: kind });
      toast.success(`${label} updated`);
    } catch (err) {
      toast.error((err as Error).message || `Failed to upload ${label.toLowerCase()}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = async () => {
    try {
      await removeImage(kind);
      toast.success(`${label} removed`);
    } catch (err) {
      toast.error((err as Error).message || `Failed to remove ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-foreground/70">{label}</label>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <div
          className={`flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background ${aspect ?? ""}`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload />
              )}
              Upload
            </Button>
            {url && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isRemoving}
                onClick={handleRemove}
              >
                <Trash2 />
                Remove
              </Button>
            )}
          </div>
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGES}
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0])}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function SchoolInformationSetup() {
  const { school, isLoading, update, isUpdating } = useSchoolInformation();

  const [values, setValues] = useState<FormValues>({});
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const initializedRef = useRef(false);

  useEffect(() => {
    if (school && !initializedRef.current) {
      setValues(schoolToFormValues(school));
      initializedRef.current = true;
    }
  }, [school]);

  const setField = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!values.schoolName?.trim()) {
      nextErrors.schoolName = "School name is required";
    }
    if (!values.country?.trim()) {
      nextErrors.country = "Country is required";
    }
    const year = values.establishedYear?.trim();
    if (year && !/^\d{4}$/.test(year)) {
      nextErrors.establishedYear = "Enter a valid 4-digit year";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please fix the highlighted fields");
      return;
    }

    try {
      await update({
        schoolName: values.schoolName.trim(),
        shortName: clean(values.shortName ?? ""),
        abbrev: clean(values.abbrev ?? ""),
        schoolCode: clean(values.schoolCode ?? ""),
        registrationNumber: clean(values.registrationNumber ?? ""),
        schoolType: clean(values.schoolType ?? ""),
        managementType: clean(values.managementType ?? ""),
        establishedYear: year ? Number(year) : null,
        address: clean(values.address ?? ""),
        addressFull: clean(values.addressFull ?? ""),
        municipality: clean(values.municipality ?? ""),
        district: clean(values.district ?? ""),
        province: clean(values.province ?? ""),
        country: values.country.trim(),
        phone: clean(values.phone ?? ""),
        alternativePhone: clean(values.alternativePhone ?? ""),
        email: clean(values.email ?? ""),
        emailAlt: clean(values.emailAlt ?? ""),
        website: clean(values.website ?? ""),
        principalName: clean(values.principalName ?? ""),
        principalContact: clean(values.principalContact ?? ""),
        headerText: clean(values.headerText ?? ""),
        footerText: clean(values.footerText ?? ""),
        reportCardHeader: clean(values.reportCardHeader ?? ""),
        marksheetHeader: clean(values.marksheetHeader ?? ""),
        certificateHeader: clean(values.certificateHeader ?? ""),
      });
      setIsDirty(false);
      toast.success("School information saved");
    } catch (err) {
      toast.error((err as Error).message || "Failed to save school information");
    }
  };

  if (isLoading || !initializedRef.current) {
    return <SanskarLoader />;
  }

  const bind = (name: string) => ({
    value: values[name] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(name, e.target.value),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">School Information</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Configure school details used across the dashboard, report cards,
            marksheets and transcripts.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || isUpdating}>
          {isUpdating ? <Loader2 className="animate-spin" /> : <Save />}
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="principal">Principal</TabsTrigger>
          <TabsTrigger value="branding">Branding &amp; Documents</TabsTrigger>
        </TabsList>

        {/* ── Basic Info ─────────────────────────────────────────────── */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2 lg:grid-cols-3">
              <Field label="School Name *" error={errors.schoolName} hint="Shown across all documents">
                <Input {...bind("schoolName")} placeholder="e.g. Sanskar Vatika School" />
              </Field>
              <Field label="Short Name" hint="Used in headings and titles">
                <Input {...bind("shortName")} placeholder="e.g. Sanskar Vatika School" />
              </Field>
              <Field label="Abbreviation" hint="e.g. SVS — shown in sidebar">
                <Input {...bind("abbrev")} maxLength={20} placeholder="SVS" />
              </Field>
              <Field label="School Code">
                <Input {...bind("schoolCode")} placeholder="e.g. 12345" />
              </Field>
              <Field label="Registration Number">
                <Input {...bind("registrationNumber")} placeholder="Registration / PAN number" />
              </Field>
              <Field label="Established Year" error={errors.establishedYear}>
                <Input {...bind("establishedYear")} inputMode="numeric" maxLength={4} placeholder="e.g. 2050" />
              </Field>
              <Field label="School Type" hint="e.g. Institutional, Community">
                <Input {...bind("schoolType")} placeholder="Institutional" />
              </Field>
              <Field label="Management Type" hint="e.g. Private, Public">
                <Input {...bind("managementType")} placeholder="Private" />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Address ────────────────────────────────────────────────── */}
        <TabsContent value="address">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Short Address" hint="Compact one-line address for documents">
                <Input {...bind("address")} placeholder="e.g. Kirtipur, Kathmandu" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Full Address">
                  <Textarea {...bind("addressFull")} rows={2} placeholder="Street, ward, city, district" />
                </Field>
              </div>
              <Field label="Municipality">
                <Input {...bind("municipality")} placeholder="e.g. Kirtipur Municipality" />
              </Field>
              <Field label="District">
                <Input {...bind("district")} placeholder="e.g. Kathmandu" />
              </Field>
              <Field label="Province">
                <Input {...bind("province")} placeholder="e.g. Bagmati" />
              </Field>
              <Field label="Country *" error={errors.country}>
                <Input {...bind("country")} placeholder="Nepal" />
              </Field>
              <div className="hidden items-center gap-2 text-muted-foreground md:flex">
                <MapPin className="h-4 w-4" />
                <span className="text-[11px]">Appears on marksheets and transcripts</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Contact ────────────────────────────────────────────────── */}
        <TabsContent value="contact">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2 lg:grid-cols-3">
              <Field label="Primary Phone">
                <Input {...bind("phone")} placeholder="e.g. 9802009272" />
              </Field>
              <Field label="Alternative Phone">
                <Input {...bind("alternativePhone")} placeholder="e.g. 01-4331234" />
              </Field>
              <Separator className="hidden lg:block" />
              <Field label="Primary Email">
                <Input {...bind("email")} type="email" placeholder="school@example.com" />
              </Field>
              <Field label="Alternative Email">
                <Input {...bind("emailAlt")} type="email" placeholder="info@example.com" />
              </Field>
              <Field label="Website" hint="Displayed without protocol, e.g. www.example.com">
                <Input {...bind("website")} placeholder="www.example.edu.np" />
              </Field>
              <div className="hidden items-center gap-2 text-muted-foreground md:flex">
                <Phone className="h-4 w-4" />
                <span className="text-[11px]">Shown in document footers</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Principal ──────────────────────────────────────────────── */}
        <TabsContent value="principal">
          <Card>
            <CardContent className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-2">
              <div className="grid grid-cols-1 content-start gap-4">
                <Field label="Principal Name">
                  <Input {...bind("principalName")} placeholder="Full name" />
                </Field>
                <Field label="Principal Contact">
                  <Input {...bind("principalContact")} placeholder="Phone number" />
                </Field>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserRound className="h-4 w-4" />
                  <span className="text-[11px]">Signature appears beside the name on result documents</span>
                </div>
              </div>
              <ImageField
                label="Principal Signature"
                hint="PNG with transparent background recommended"
                url={school?.principalSignatureUrl ?? null}
                kind="signature"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Branding & Documents ───────────────────────────────────── */}
        <TabsContent value="branding">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
            <Card>
              <CardContent className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-2">
                <ImageField
                  label="School Logo"
                  hint="Used in sidebar, loader and all documents"
                  url={school?.logoUrl ?? null}
                  kind="logo"
                />
                <ImageField
                  label="Favicon"
                  hint="Browser tab icon"
                  url={school?.faviconUrl ?? null}
                  kind="favicon"
                />
                <ImageField
                  label="School Stamp"
                  hint="Official round stamp for documents"
                  url={school?.schoolStampUrl ?? null}
                  kind="stamp"
                />
                <div className="grid grid-cols-1 content-start gap-4">
                  <Field label="Header Text">
                    <Textarea {...bind("headerText")} rows={2} placeholder="Optional line above the school name" />
                  </Field>
                  <Field label="Footer Text">
                    <Textarea {...bind("footerText")} rows={2} placeholder="Optional footer note on documents" />
                  </Field>
                </div>
                <Separator className="lg:col-span-2" />
                <Field label="Report Card Header">
                  <Textarea {...bind("reportCardHeader")} rows={2} placeholder="Custom heading printed on report cards" />
                </Field>
                <Field label="Marksheet Header">
                  <Textarea {...bind("marksheetHeader")} rows={2} placeholder="Custom heading printed on marksheets" />
                </Field>
                <Field label="Certificate Header">
                  <Textarea {...bind("certificateHeader")} rows={2} placeholder="Custom heading printed on certificates" />
                </Field>
              </CardContent>
            </Card>

            {/* Live preview */}
            <Card className="h-fit xl:sticky xl:top-4">
              <CardContent className="pt-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Document Header Preview
                </p>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    {school?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={school.logoUrl} alt="Logo" className="h-14 w-14 object-contain" />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground/40" />
                    )}
                    <div className="min-w-0">
                      {(values.headerText ?? "").trim() !== "" && (
                        <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                          {values.headerText}
                        </p>
                      )}
                      <p className="truncate text-base font-bold">
                        {(values.shortName ?? "").trim() || values.schoolName || "School Name"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {[
                          values.address,
                          values.phone ? `📞 ${values.phone}` : "",
                          values.email ? `✉ ${values.email}` : "",
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Address · Contact"}
                      </p>
                    </div>
                  </div>
                  {(values.reportCardHeader ?? "").trim() !== "" && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-center text-[11px] font-semibold">
                        {values.reportCardHeader}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sticky save bar */}
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-4 flex items-center justify-between rounded-xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur"
        >
          <p className="text-sm text-muted-foreground">
            You have unsaved changes.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (school) setValues(schoolToFormValues(school));
                setIsDirty(false);
                setErrors({});
              }}
              disabled={isUpdating}
            >
              Discard
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="animate-spin" /> : <Save />}
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
