INSERT INTO email_template (key, path, kind, name, subject, body, metadata, is_active, updated_at)
VALUES
('auth.confirmation', 'auth/confirmation.html', 'auth', 'E-Mail-Bestätigung', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Registrierung im Kulturkataster. Damit wir sicherstellen können, dass Ihre E-Mail-Adresse korrekt ist, bitten wir Sie um eine kurze Bestätigung.

[E-Mail-Adresse bestätigen]({{ .ConfirmationURL }})

**Hinweis zur Registrierung als Verwaltungsmitarbeiter\*in oder für einen Verband/Netzwerk**

Sollten Sie sich als Mitarbeiter\*in einer Bezirksverwaltung, der Landesverwaltung Berlin oder eines Spartenverbands/Netzwerkes registriert haben, prüft unsere Redaktion Ihre Angaben. Nach Abschluss der Prüfung melden wir uns hierzu nochmals per E-Mail bei Ihnen.

Wenn Sie sich nicht selbst registriert haben, können Sie diese E-Mail ignorieren. Bei Fragen hilft Ihnen unser Team gern weiter.

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for registering with the Kulturkataster. To make sure your email address is correct, please confirm it via the link below.

[Confirm email address]({{ .ConfirmationURL }})

**Note on registrations as an administrative employee or for an association/network**

If you registered as an employee of a district administration, the Berlin state administration, or as a representative of an association or network, our editorial team will review your details. Once the review is complete, we will contact you again by email.

If you did not register yourself, you can ignore this email. If you have any questions, our team will be happy to help.

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('auth.email_change', 'auth/email_change.html', 'auth', 'E-Mail-Änderung bestätigen', NULL, 'Guten Tag,

bitte bestätigen Sie die Änderung Ihrer E-Mail-Adresse auf **{{ .NewEmail }}**.

Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:

{{ .ConfirmationURL }}

Wenn Sie diese Änderung nicht angefordert haben, ignorieren Sie diese E-Mail.

Viele Grüße

vom Projektteam Kulturkataster
', '{"format":"markdown"}'::jsonb, true, NOW()),
('auth.email_changed', 'auth/email_changed.html', 'auth', 'E-Mail-Adresse geändert', NULL, 'Guten Tag,

Ihre E-Mail-Adresse wurde erfolgreich geändert.

**Neu:** {{ .NewEmail }}

**Bisher:** {{ .OldEmail }}

Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte umgehend die Redaktion unter [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster
', '{"format":"markdown"}'::jsonb, true, NOW()),
('auth.invite', 'auth/invite.html', 'auth', 'Einladung', NULL, 'Guten Tag,

Sie wurden zum Kulturkataster eingeladen. Nutzen Sie den folgenden Link, um Ihre Einladung anzunehmen und Ihr Konto zu aktivieren.

Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:

{{ .ConfirmationURL }}

Viele Grüße

vom Projektteam Kulturkataster
', '{"format":"markdown"}'::jsonb, true, NOW()),
('auth.magic_link', 'auth/magic_link.html', 'auth', 'Magic Link', NULL, 'Guten Tag,

mit dem folgenden Link können Sie sich einmalig und sicher anmelden.

Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:

{{ .ConfirmationURL }}

Viele Grüße

vom Projektteam Kulturkataster
', '{"format":"markdown"}'::jsonb, true, NOW()),
('auth.password_changed', 'auth/password_changed.html', 'auth', 'Passwort geändert', NULL, 'Ihr Passwort wurde erfolgreich geändert.

Falls Sie diese Änderung nicht selbst vorgenommen haben, wenden Sie sich bitte sofort an [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster
', '{"format":"markdown"}'::jsonb, true, NOW()),
('auth.reauthentication', 'auth/reauthentication.html', 'auth', 'Erneute Authentifizierung', NULL, 'Bitte bestätigen Sie diesen Vorgang.

Einmalcode: **{{ .Token }}**

Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:

{{ .ConfirmationURL }}

Viele Grüße

vom Projektteam Kulturkataster
', '{"format":"markdown"}'::jsonb, true, NOW()),
('auth.recovery', 'auth/recovery.html', 'auth', 'Passwort zurücksetzen', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

Sie haben angegeben, dass Sie Ihr Passwort für den User-Bereich des Kulturkatasters zurücksetzen möchten. Über den folgenden Link können Sie ein neues Passwort vergeben:

[Passwort zurücksetzen]({{ .ConfirmationURL }})

Falls der Button/Link nicht funktioniert, können Sie den folgenden Link in die Adresszeile Ihres Browsers kopieren und öffnen:

{{ .ConfirmationURL }}

Wenn Sie kein Zurücksetzen angefordert haben, können Sie diese E-Mail ignorieren – Ihr Passwort bleibt dann unverändert.

Bei Fragen helfen Ihnen die FAQs im User-Bereich weiter:

[{{ .SiteURL }}/de/faq]({{ .SiteURL }}/de/faq)

Oder wenden Sie sich an unsere Redaktion: [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

You requested to reset your password for the Kulturkataster user area. You can set a new password using the link below:

[Reset password]({{ .ConfirmationURL }})

If the button/link does not work, you can copy the following link into your browser''s address bar:

{{ .ConfirmationURL }}

If you did not request a password reset, you can ignore this email — your password will remain unchanged.

If you have questions, the FAQs in the user area can help:

[{{ .SiteURL }}/de/faq]({{ .SiteURL }}/de/faq)

Or contact our editorial team: [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.account_deleted', 'custom/account_deleted.html', 'custom', 'Konto gelöscht', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

Sie haben Ihren Account im Kulturkataster erfolgreich gelöscht. Ab sofort können Sie sich mit dieser E-Mail-Adresse nicht mehr im User-Bereich anmelden.

Falls Sie Ihren Account nicht selbst gelöscht haben oder Fragen zum Vorgang haben, wenden Sie sich gern an unsere Redaktion: [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

You have successfully deleted your Kulturkataster account. From now on, you can no longer sign in to the user area with this email address.

If you did not delete your account yourself or if you have questions about this process, please contact our editorial team: [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.claim_approved', 'custom/claim_approved.html', 'custom', 'Bestätigung für “Kulturort beanspruchen”', 'Ihr Kulturort {{ .Data.institution_name }} wurde Ihrem Kulturkatasterportal hinzugefügt / Your venue {{ .Data.institution_name }} has been added to your Kulturkataster dashboard', 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Anfrage, den Kulturort {{ .Data.institution_name }} im Kulturkataster zu pflegen. Wir haben Ihre Angaben geprüft und Ihrer Anfrage stattgegeben.

Ab sofort ist {{ .Data.institution_name }} in Ihrem Kulturkatasterportal hinterlegt und für Sie jederzeit schnell erreichbar. Sie können dort Informationen einsehen und Änderungen vorschlagen (z. B. Texte, Kontaktdaten oder weitere Angaben), um das Profil aktuell zu halten.

Bitte beachten Sie: Vorgeschlagene Änderungen werden erst nach einer redaktionellen Prüfung im Kulturkataster veröffentlicht. Den Status Ihrer Vorschläge können Sie jederzeit in Ihrem Kulturkatasterportal nachverfolgen. Eine zusätzliche E-Mail zu einzelnen angenommenen Änderungen versenden wir nicht.

[Zum Kulturkatasterportal]({{ .Data.portal_url }})

Bei Fragen hilft Ihnen der FAQ-Bereich im User-Bereich weiter:

[FAQs]({{ .Data.faq_url }})

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for your request to maintain the venue {{ .Data.institution_name }} in the Kulturkataster. We have reviewed your details and approved your request.

From now on, {{ .Data.institution_name }} is saved in your Kulturkataster dashboard and is available to you at any time. You can view information there and suggest changes (e.g. texts, contact details, or other information) to keep the profile up to date.

Please note: Suggested changes will only be published in the Kulturkataster after editorial review. You can track the status of your suggestions at any time in your Kulturkataster dashboard. We do not send an additional email for individual approved changes.

[Go to the Kulturkataster dashboard]({{ .Data.portal_url }})

If you have questions, the FAQ section in the user area can help:

[FAQs]({{ .Data.faq_url_en }})

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.claim_rejected', 'custom/claim_rejected.html', 'custom', 'Ablehnung für “Kulturort beanspruchen”', 'Ihre Anfrage zur Pflege des Kulturorts {{ .Data.institution_name }} / Your request to maintain the venue {{ .Data.institution_name }}', 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Anfrage, den Kulturort {{ .Data.institution_name }} im Kulturkataster zu pflegen. Wir haben Ihre Angaben geprüft.

Leider können wir Ihrer Anfrage in diesem Fall nicht nachkommen. Das kann z. B. daran liegen, dass die Zugehörigkeit zum Kulturort nicht ausreichend nachvollziehbar ist oder der Kulturort bereits einer anderen zuständigen Person zugeordnet ist.

Hilfreiche Informationen finden Sie in den FAQs im User-Bereich:

[FAQs]({{ .Data.faq_url }})

Sollten Sie darüber hinaus Fragen haben oder weitere Hinweise zur Zuordnung geben wollen, können Sie sich gern an unsere Redaktion wenden: [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for your request to maintain the venue {{ .Data.institution_name }} in the Kulturkataster. We have reviewed your details.

Unfortunately, we cannot approve your request in this case. This may be because your connection to the venue cannot be sufficiently verified or because the venue is already assigned to another responsible person.

Helpful information can be found in the FAQs in the user area:

[FAQs]({{ .Data.faq_url_en }})

If you have further questions or would like to provide additional information regarding the assignment, please contact our editorial team at: [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.compliance_resend', 'custom/compliance_resend.html', 'custom', 'Compliance erneut senden', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

bitte bestätigen Sie Ihre Compliance-Angaben im User-Bereich des Berliner Kulturkatasters.

Öffnen Sie dazu Ihre Kontoeinstellungen:

Falls der Button nicht funktioniert, können Sie den folgenden Link in die Adresszeile Ihres Browsers kopieren:

{{ .SiteURL }}/account/edit

Bei Fragen wenden Sie sich an: [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.role_district_approved', 'custom/role_district_approved.html', 'custom', 'Bezirksrolle bestätigt', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Registrierung im Kulturkataster als Mitarbeiter\*in einer Bezirksverwaltung. Wir haben Ihre Angaben geprüft und Ihre Rolle für {{ .Data.district }} freigeschaltet.

Ab sofort können Sie im User-Bereich Kulturorte in {{ .Data.district }} in Ihrem Kulturkatasterportal einsehen und Änderungen vorschlagen, um die Einträge aktuell zu halten. Bitte beachten Sie: Auch diese Vorschläge werden vor der Veröffentlichung im Kulturkataster redaktionell geprüft. Den Status Ihrer Vorschläge können Sie jederzeit in Ihrem Kulturkatasterportal nachverfolgen.

[Zum Kulturkatasterportal]({{ .Data.portal_url }})

Antworten auf häufige Fragen finden Sie in den FAQs:

[FAQs]({{ .Data.faq_url }})

Wenn Sie darüber hinaus Unterstützung benötigen, erreichen Sie unsere Redaktion unter [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for registering with the Kulturkataster as an employee of a district administration. We have reviewed your details and activated your role for {{ .Data.district }}.

From now on, you can view venues in {{ .Data.district }} in your Kulturkataster dashboard and suggest changes to keep the entries up to date. Please note: These suggestions are also reviewed by our editorial team before being published in the Kulturkataster. You can track the status of your suggestions at any time in your Kulturkataster dashboard.

[Go to the Kulturkataster dashboard]({{ .Data.portal_url }})

Answers to frequently asked questions can be found in the FAQs:

[FAQs]({{ .Data.faq_url_en }})

If you need further support, you can reach our editorial team at [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.role_district_rejected', 'custom/role_district_rejected.html', 'custom', 'Bezirksrolle abgelehnt', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Registrierung im Kulturkataster als Mitarbeiter\*in einer Bezirksverwaltung. Wir haben Ihre Angaben geprüft.

Leider können wir Ihre Registrierung für {{ .Data.district }} in diesem Fall nicht freischalten. Ihr Benutzerkonto bleibt selbstverständlich bestehen – Sie können den User-Bereich weiterhin wie gewohnt nutzen. Lediglich die Rolle als Bezirksmitarbeiter\*in (inklusive der damit verbundenen Vorschlagsrechte für Kulturorte in {{ .Data.district }}) wurde nicht aktiviert.

Antworten auf häufige Fragen finden Sie in den FAQs im User-Bereich:

[FAQs]({{ .Data.faq_url }})

Wenn Sie Rückfragen haben oder mit unserer Entscheidung nicht einverstanden sind, melden Sie sich gern bei der Redaktion unter [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.role_network_approved', 'custom/role_network_approved.html', 'custom', 'Netzwerkrolle bestätigt', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Registrierung im Kulturkataster als Mitarbeiter\*in eines Verbands/Netzwerks. Wir haben Ihre Angaben geprüft und Ihre Rolle freigeschaltet.

Ab sofort können Sie im User-Bereich die Ihrem Verband/Netzwerk zugeordneten Kulturorte in Ihrem Kulturkatasterportal einsehen und Änderungen vorschlagen, um die Einträge aktuell zu halten. Bitte beachten Sie: Vorgeschlagene Änderungen werden vor der Veröffentlichung im Kulturkataster redaktionell geprüft. Den Status Ihrer Vorschläge können Sie jederzeit in Ihrem Kulturkatasterportal nachverfolgen.

[Zum Kulturkatasterportal]({{ .Data.portal_url }})

Antworten auf häufige Fragen finden Sie in den FAQs:

[FAQs]({{ .Data.faq_url }})

Wenn Sie darüber hinaus Unterstützung benötigen, erreichen Sie unsere Redaktion unter [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for registering with the Kulturkataster as an employee of an association/network. We have reviewed your details and activated your role.

From now on, you can view the venues assigned to your association/network in your Kulturkataster dashboard and suggest changes to keep the entries up to date. Please note: Suggested changes are reviewed by our editorial team before being published in the Kulturkataster. You can track the status of your suggestions at any time in your Kulturkataster dashboard.

[Go to the Kulturkataster dashboard]({{ .Data.portal_url }})

Answers to frequently asked questions can be found in the FAQs:

[FAQs]({{ .Data.faq_url_en }})

If you need further support, you can reach our editorial team at [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.role_network_rejected', 'custom/role_network_rejected.html', 'custom', 'Netzwerkrolle abgelehnt', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Registrierung im Kulturkataster als Mitarbeiter\*in eines Verbands/Netzwerks. Wir haben Ihre Angaben geprüft.

Leider können wir Ihre Registrierung in dieser Rolle in diesem Fall nicht freischalten. Ihr Benutzerkonto bleibt selbstverständlich bestehen – Sie können den User-Bereich weiterhin wie gewohnt nutzen. Lediglich die Rolle als Mitarbeitende\*r eines Verbands/Netzwerks (inklusive der damit verbundenen Vorschlagsrechte für die zugeordneten Kulturorte) wurde nicht aktiviert.

Antworten auf häufige Fragen finden Sie in den FAQs im User-Bereich:

[FAQs]({{ .Data.faq_url }})

Wenn Sie Rückfragen haben oder mit unserer Entscheidung nicht einverstanden sind, melden Sie sich gern bei der Redaktion unter [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for registering with the Kulturkataster as an employee of an association/network. We have reviewed your details.

Unfortunately, we cannot activate your registration for this role in this case. Your user account will of course remain active — you can continue to use the user area as usual. Only the role as an association/network staff member (including the associated rights to suggest changes for the assigned venues) has not been activated.

Answers to frequently asked questions can be found in the FAQs in the user area:

[FAQs]({{ .Data.faq_url_en }})

If you have questions or disagree with our decision, please contact our editorial team at [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.role_state_approved', 'custom/role_state_approved.html', 'custom', 'Landesrolle bestätigt', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Registrierung im Kulturkataster als Mitarbeiter\*in des Landes Berlin. Wir haben Ihre Angaben geprüft und Ihre Rolle freigeschaltet.

Ab sofort können Sie im User-Bereich alle Kulturorte im Kulturkatasterportal einsehen und Änderungen vorschlagen, um Einträge aktuell zu halten. Bitte beachten Sie: Vorgeschlagene Änderungen werden vor der Veröffentlichung im Kulturkataster redaktionell geprüft. Den Status Ihrer Vorschläge können Sie jederzeit in Ihrem Kulturkatasterportal nachverfolgen.

[Zum Kulturkatasterportal]({{ .Data.portal_url }})

Antworten auf häufige Fragen finden Sie in den FAQs:

[FAQs]({{ .Data.faq_url }})

Wenn Sie darüber hinaus Unterstützung benötigen, erreichen Sie unsere Redaktion unter [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for registering with the Kulturkataster as an employee of the Berlin state administration. We have reviewed your details and activated your role.

From now on, you can view all venues in the Kulturkataster dashboard and suggest changes to keep entries up to date. Please note: Suggested changes are reviewed by our editorial team before being published in the Kulturkataster. You can track the status of your suggestions at any time in your Kulturkataster dashboard.

[Go to the Kulturkataster dashboard]({{ .Data.portal_url }})

Answers to frequently asked questions can be found in the FAQs:

[FAQs]({{ .Data.faq_url_en }})

If you need further support, you can reach our editorial team at [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.role_state_rejected', 'custom/role_state_rejected.html', 'custom', 'Landesrolle abgelehnt', NULL, 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Registrierung im Kulturkataster als Mitarbeiter\*in des Landes Berlin. Wir haben Ihre Angaben geprüft.

Leider können wir Ihre Registrierung in dieser Rolle in diesem Fall nicht freischalten. Ihr Benutzerkonto bleibt selbstverständlich bestehen – Sie können den User-Bereich weiterhin wie gewohnt nutzen. Lediglich die Rolle als Landesmitarbeiter\*in (inklusive der damit verbundenen Vorschlagsrechte für Kulturorte im gesamten Stadtgebiet) wurde nicht aktiviert.

Antworten auf häufige Fragen finden Sie in den FAQs im User-Bereich:

[FAQs]({{ .Data.faq_url }})

Wenn Sie Rückfragen haben oder mit unserer Entscheidung nicht einverstanden sind, melden Sie sich gern bei der Redaktion unter [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for registering with the Kulturkataster as an employee of the Berlin state administration. We have reviewed your details.

Unfortunately, we cannot activate your registration for this role in this case. Your user account will of course remain active — you can continue to use the user area as usual. Only the role as a Berlin state administration staff member (including the associated rights to suggest changes for venues across the entire city) has not been activated.

Answers to frequently asked questions can be found in the FAQs in the user area:

[FAQs]({{ .Data.faq_url_en }})

If you have questions or disagree with our decision, please contact our editorial team at [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.submission_approved', 'custom/submission_approved.html', 'custom', 'Bestätigung für “Kulturort beanspruchen”', 'Ihr Kulturort {{ .Data.institution_name }} wurde Ihrem Kulturkatasterportal hinzugefügt / Your venue {{ .Data.institution_name }} has been added to your Kulturkataster dashboard', 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Anfrage, den Kulturort {{ .Data.institution_name }} im Kulturkataster zu pflegen. Wir haben Ihre Angaben geprüft und Ihrer Anfrage stattgegeben.

Ab sofort ist {{ .Data.institution_name }} in Ihrem Kulturkatasterportal hinterlegt und für Sie jederzeit schnell erreichbar. Sie können dort Informationen einsehen und Änderungen vorschlagen (z. B. Texte, Kontaktdaten oder weitere Angaben), um das Profil aktuell zu halten.

Bitte beachten Sie: Vorgeschlagene Änderungen werden erst nach einer redaktionellen Prüfung im Kulturkataster veröffentlicht. Den Status Ihrer Vorschläge können Sie jederzeit in Ihrem Kulturkatasterportal nachverfolgen. Eine zusätzliche E-Mail zu einzelnen angenommenen Änderungen versenden wir nicht.

[Zum Kulturkatasterportal]({{ .Data.portal_url }})

Bei Fragen hilft Ihnen der FAQ-Bereich im User-Bereich weiter:

[FAQs]({{ .Data.faq_url }})

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for your request to maintain the venue {{ .Data.institution_name }} in the Kulturkataster. We have reviewed your details and approved your request.

From now on, {{ .Data.institution_name }} is saved in your Kulturkataster dashboard and is available to you at any time. You can view information there and suggest changes (e.g. texts, contact details, or other information) to keep the profile up to date.

Please note: Suggested changes will only be published in the Kulturkataster after editorial review. You can track the status of your suggestions at any time in your Kulturkataster dashboard. We do not send an additional email for individual approved changes.

[Go to the Kulturkataster dashboard]({{ .Data.portal_url }})

If you have questions, the FAQ section in the user area can help:

[FAQs]({{ .Data.faq_url_en }})

Kind regards,

the Kulturkataster project team

**Kulturraum Berlin gGmbH**
', '{"format":"markdown"}'::jsonb, true, NOW()),
('custom.submission_rejected', 'custom/submission_rejected.html', 'custom', 'Ablehnung für “Kulturort beanspruchen”', 'Ihre Anfrage zur Pflege des Kulturorts {{ .Data.institution_name }} / Your request to maintain the venue {{ .Data.institution_name }}', 'Guten Tag {{ .Data.first_name }} {{ .Data.last_name }},

vielen Dank für Ihre Anfrage, den Kulturort {{ .Data.institution_name }} im Kulturkataster zu pflegen. Wir haben Ihre Angaben geprüft.

Leider können wir Ihrer Anfrage in diesem Fall nicht nachkommen. Das kann z. B. daran liegen, dass die Zugehörigkeit zum Kulturort nicht ausreichend nachvollziehbar ist oder der Kulturort bereits einer anderen zuständigen Person zugeordnet ist.

Hilfreiche Informationen finden Sie in den FAQs im User-Bereich:

[FAQs]({{ .Data.faq_url }})

Sollten Sie darüber hinaus Fragen haben oder weitere Hinweise zur Zuordnung geben wollen, können Sie sich gern an unsere Redaktion wenden: [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

Viele Grüße

vom Projektteam Kulturkataster

**Kulturraum Berlin gGmbH**

---

Hello {{ .Data.first_name }} {{ .Data.last_name }},

Thank you for your request to maintain the venue {{ .Data.institution_name }} in the Kulturkataster. We have reviewed your details.

Unfortunately, we cannot approve your request in this case. This may be because your connection to the venue cannot be sufficiently verified or because the venue is already assigned to another responsible person.

Helpful information can be found in the FAQs in the user area:

[FAQs]({{ .Data.faq_url_en }})

If you have further questions or would like to provide additional information regarding the assignment, please contact our editorial team at: [info@kulturkataster.berlin](mailto:info@kulturkataster.berlin).

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
