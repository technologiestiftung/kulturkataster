# Email Templates

This directory contains HTML email templates used by:

- `auth/`: Supabase GoTrue auth templates (configured in Supabase Auth settings)
- `custom/`: frontend-managed transactional templates sent from server actions

## Placeholder Terminology

Custom templates use the same placeholder style as Supabase templates:

- `{{ .ConfirmationURL }}`
- `{{ .Token }}`
- `{{ .TokenHash }}`
- `{{ .SiteURL }}`
- `{{ .RedirectTo }}`
- `{{ .Data }}` and nested values like `{{ .Data.first_name }}`
- `{{ .Email }}`
- `{{ .NewEmail }}`
- `{{ .OldEmail }}`
- `{{ .Phone }}`
- `{{ .OldPhone }}`
- `{{ .Provider }}`
- `{{ .FactorType }}`

Unknown placeholders resolve to an empty string.

## Best Practices

- Keep auth templates in `auth/` and non-auth templates in `custom/`.
- Avoid secrets/tokens in email body unless absolutely necessary.
- Use `EMAIL_PROVIDER=smtp` for real delivery and `EMAIL_PROVIDER=noop` for local/test.
- For SMTP on port `587` with STARTTLS, set `SMTP_SECURE=false`.
- Ensure all links point to `SITE_URL` and allowed redirect domains.

## Custom Template Catalog

- `custom/claim_approved.html`
  - Subject: `Ihr Kulturort {{ .Data.institution_name }} wurde Ihrem Kulturkatasterportal hinzugefügt`
  - Uses: `Data.first_name`, `Data.last_name`, `Data.institution_name`, `Data.portal_url`, `Data.faq_url`

- `custom/claim_rejected.html`
  - Subject: `Ihre Anfrage zur Pflege des Kulturorts {{ .Data.institution_name }}`
  - Uses: `Data.first_name`, `Data.last_name`, `Data.institution_name`, `Data.faq_url`

- `custom/role_district_approved.html`
  - Subject: `Freigabe als Bezirksmitarbeitende*r für {{ .Data.district }}`
  - Uses: `Data.first_name`, `Data.last_name`, `Data.district`, `Data.portal_url`, `Data.faq_url`

- `custom/role_district_rejected.html`
  - Subject: `Ihre Registrierung als Bezirksmitarbeitende*r für {{ .Data.district }}`
  - Uses: `Data.first_name`, `Data.last_name`, `Data.district`, `Data.faq_url`

- `custom/role_state_approved.html`
  - Subject: `Freigabe als Landesmitarbeitende*r (Berlin)`
  - Uses: `Data.first_name`, `Data.last_name`, `Data.portal_url`, `Data.faq_url`

- `custom/role_state_rejected.html`
  - Subject: `Ihre Registrierung als Landesmitarbeitende*r (Berlin)`
  - Uses: `Data.first_name`, `Data.last_name`, `Data.faq_url`

- `custom/role_network_approved.html`
  - Subject: `Freigabe als Mitarbeitende*r eines Verbands/Netzwerks`
  - Uses: `Data.first_name`, `Data.last_name`, `Data.portal_url`, `Data.faq_url`

- `custom/role_network_rejected.html`
  - Subject: `Ihre Registrierung als Mitarbeitende*r eines Verbands/Netzwerks`
  - Uses: `Data.first_name`, `Data.last_name`, `Data.faq_url`

- `custom/account_deleted.html`
  - Subject: `Ihr Kulturkataster-Account wurde gelöscht`
  - Uses: `Data.first_name`, `Data.last_name`
