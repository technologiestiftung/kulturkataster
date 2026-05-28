INSERT INTO "email_template" (
    "key",
    "path",
    "kind",
    "name",
    "description",
    "subject",
    "body",
    "is_active",
    "updated_at"
)
VALUES (
    'custom.institution_download_notification',
    'custom/institution_download_notification.html',
    'custom',
    'Institution export download notification',
    'Administrative notification sent when institution data is downloaded.',
    'Kulturkataster: Datenexport {{ .Data.filename }}.{{ .Data.format }}',
    '# Export download notification

A data export was downloaded from the Kulturkataster.

**Name:** {{ .Data.requester_name }}

**Email:** {{ .Data.requester_email }}

**Export:** {{ .Data.filename }}.{{ .Data.format }}

**Institution count:** {{ .Data.institution_count }}

**Usage purpose:** {{ .Data.usage_purpose }}

**Institution IDs:** {{ .Data.institution_ids }}
',
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("path") DO UPDATE SET
    "key" = EXCLUDED."key",
    "kind" = EXCLUDED."kind",
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "subject" = EXCLUDED."subject",
    "body" = EXCLUDED."body",
    "is_active" = EXCLUDED."is_active",
    "updated_at" = CURRENT_TIMESTAMP;
