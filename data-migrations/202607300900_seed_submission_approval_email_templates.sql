INSERT INTO email_template (key, path, kind, name, subject, body, metadata, is_active, updated_at)
VALUES
('custom.submission_create_approved', 'custom/submission_create_approved.html', 'custom', 'Bestätigung für “Neuen Kulturort vorschlagen”', 'Ihr vorgeschlagener Kulturort {{ .Data.institution_name }} wurde dem Kulturkataster hinzugefügt / Your suggested venue {{ .Data.institution_name }} has been added to the Kulturkataster', 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihren Vorschlag, den Kulturort {{ .Data.institution_name }} in das Kulturkataster aufzunehmen.

Wir haben Ihre Einreichung geprüft und den Kulturort dem Kulturkataster hinzugefügt.

Sie können den Kulturort im Kulturkatasterportal einsehen:

[Zum Kulturkatasterportal]({{ .Data.portal_url }})

Bei Fragen hilft Ihnen der FAQ-Bereich im User-Bereich weiter:

[FAQs]({{ .Data.faq_url }})

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for suggesting the venue {{ .Data.institution_name }} for inclusion in the Kulturkataster.

We have reviewed your submission and added the venue to the Kulturkataster.

You can view the venue in the Kulturkataster dashboard:

[Go to the Kulturkataster dashboard]({{ .Data.portal_url }})

If you have questions, the FAQ section in the user area can help:

[FAQs]({{ .Data.faq_url_en }})

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.submission_update_approved', 'custom/submission_update_approved.html', 'custom', 'Bestätigung für “Änderung vorschlagen”', 'Ihre Änderung zum Kulturort {{ .Data.institution_name }} wurde übernommen / Your change to {{ .Data.institution_name }} has been accepted', 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre vorgeschlagenen Änderungen zum Kulturort {{ .Data.institution_name }}.

Wir haben Ihre Einreichung geprüft und die Änderungen übernommen.

Sie können den aktuellen Stand im Kulturkatasterportal einsehen:

[Zum Kulturkatasterportal]({{ .Data.portal_url }})

Bei Fragen hilft Ihnen der FAQ-Bereich im User-Bereich weiter:

[FAQs]({{ .Data.faq_url }})

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for suggesting changes to the venue {{ .Data.institution_name }}.

We have reviewed your submission and accepted the changes.

You can view the current state in the Kulturkataster dashboard:

[Go to the Kulturkataster dashboard]({{ .Data.portal_url }})

If you have questions, the FAQ section in the user area can help:

[FAQs]({{ .Data.faq_url_en }})

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW())
ON CONFLICT (path) DO UPDATE SET
  key = EXCLUDED.key,
  kind = EXCLUDED.kind,
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  metadata = EXCLUDED.metadata,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

DELETE FROM email_template
WHERE path = 'custom/submission_approved.html';

UPDATE email_template
SET
  name = 'Ablehnung für “Kulturort vorschlagen/ändern”',
  updated_at = NOW()
WHERE path = 'custom/submission_rejected.html';
