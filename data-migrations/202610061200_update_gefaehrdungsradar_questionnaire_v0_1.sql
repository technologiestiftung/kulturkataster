-- Updates the Gefährdungsradar questionnaire to the revised question set.
-- Source: 260923-Fragebogen_Version_0_1_AnpassungenKRB.odt
--
-- Existing option values are kept so stored answers stay valid; only labels,
-- order and new options/questions change. The new general questions
-- (Trägerschaft, years) go into block 0, so the wizard asks them right after
-- its hardcoded institution-link step and before block A.
--
-- The whole migration is one DO block because the runner executes each SQL
-- file as a single statement.

DO $migration$
DECLARE
	qid integer;
	rented text[] := ARRAY['rent_regular', 'rent_sublet', 'rent_temporary', 'rent_no_contract', 'rent_leasehold', 'rent_other'];
BEGIN
	SELECT id INTO qid FROM questionnaire
	WHERE title = 'Befragung zum Gefährdungsradar von Berliner Kulturorten';

	IF qid IS NULL THEN
		RAISE NOTICE 'Gefährdungsradar questionnaire not found, nothing to update';
		RETURN;
	END IF;

	-- Block titles: new block 0 for the general questions asked before block A,
	-- hyphen fix for block A, block 7 now holds more than consent.
	UPDATE questionnaire
	SET meta_data = jsonb_set(
			jsonb_set(
				jsonb_set(meta_data::jsonb, '{blocks,0}', '{"title":"Allgemeine Angaben","title_en":"General Information"}'),
				'{blocks,1,title}', '"Block A: Standort- und Vertragsdimension"'
			),
			'{blocks,7}', '{"title":"Abschließende Angaben","title_en":"Final Information"}'
		),
		updated_at = NOW()
	WHERE id = qid;

	-- Removed questions: deleting them also deletes their answers
	-- (answer.question_id cascades).
	DELETE FROM question
	WHERE questionnaire_id = qid
		AND key IN ('funder_dependency', 'publish_anonymous_consent');

	-- funder_dependency was order 3 in block C; close the gap.
	UPDATE question SET "order" = "order" - 1, updated_at = NOW()
	WHERE questionnaire_id = qid AND step = 3 AND "order" > 3;

	-- Block A: Standort und Vertrag -------------------------------------------
	-- New option "Erbpacht" counts as a rental-type arrangement (B branch).
	UPDATE question SET config = $json${"options":[
		{"value":"ownership","label":"Eigentum","label_en":"Ownership"},
		{"value":"rent_regular","label":"reguläre Miete","label_en":"Regular rent"},
		{"value":"rent_sublet","label":"Untermiete","label_en":"Sublet"},
		{"value":"rent_temporary","label":"Zwischennutzung","label_en":"Temporary/interim use"},
		{"value":"rent_no_contract","label":"Nutzung ohne schriftlichen Vertrag","label_en":"Use without a written contract"},
		{"value":"rent_leasehold","label":"Erbpacht","label_en":"Leasehold (heritable building right)"},
		{"value":"rent_other","label":"Sonstiges","label_en":"Other"}],
		"freeTextOption":{"value":"rent_other","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb,
		updated_at = NOW()
	WHERE questionnaire_id = qid AND key = 'room_usage';

	UPDATE question
	SET config = jsonb_set(config, '{condition,equals}', to_jsonb(rented)),
		updated_at = NOW()
	WHERE questionnaire_id = qid
		AND config -> 'condition' ->> 'dependsOnKey' = 'room_usage';

	UPDATE question SET config = $json${"options":[
		{"value":"fixed_rent","label":"feste Miete","label_en":"Fixed rent"},
		{"value":"graduated_rent","label":"Staffelmiete","label_en":"Graduated rent"},
		{"value":"index_rent","label":"Indexmiete","label_en":"Index-linked rent"},
		{"value":"usage_based_rent","label":"nutzungsabhängige Miete","label_en":"Usage-based rent"},
		{"value":"no_regular_rental","label":"kein reguläres Mietverhältnis","label_en":"No regular rental arrangement"},
		{"value":"unknown","label":"nicht bekannt","label_en":"Not known"},
		{"value":"other","label":"Sonstiges","label_en":"Other"}],
		"freeTextOption":{"value":"other","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb
		|| jsonb_build_object('condition', jsonb_build_object('dependsOnKey', 'room_usage', 'equals', to_jsonb(rented))),
		updated_at = NOW()
	WHERE questionnaire_id = qid AND key = 'rent_model';

	-- Block B: Immobilie und Gebäude ------------------------------------------
	-- New order: room_suitability moves to the end of the block.
	UPDATE question SET "order" = 2, updated_at = NOW(),
		label = 'Gibt es aktuell aus Ihrer Sicht Sanierungsdruck oder erheblichen Modernisierungsbedarf im Gebäude? (z. B. undichtes Dach, veraltete Heizung, Feuchtigkeit)',
		label_en = 'In your view, is there currently pressure for renovation or a significant need for modernization in the building? (e.g. leaking roof, outdated heating, damp)'
	WHERE questionnaire_id = qid AND key = 'renovation_pressure';

	UPDATE question SET "order" = 3, updated_at = NOW(),
		config = $json${"options":[
			{"value":"yes_specify","label":"ja, folgende","label_en":"Yes, namely"},
			{"value":"no","label":"nein, ist mir nicht bekannt","label_en":"No, not that I know of"},
			{"value":"unclear","label":"unklar","label_en":"Unclear"}],
			"freeTextOption":{"value":"yes_specify","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb
	WHERE questionnaire_id = qid AND key = 'alternative_use_planned';

	UPDATE question SET "order" = 4, updated_at = NOW(),
		label = 'Sind Ihnen geplante Bauprojekte im unmittelbaren Umfeld bekannt, die den Standort Ihrer Einrichtung negativ beeinflussen könnten? (z. B. Luxussanierungen, Neubauprojekte, Autobahnausbau)',
		label_en = 'Are you aware of any planned construction projects in the immediate vicinity that could negatively affect your institution''s location? (e.g. luxury renovations, new construction projects, motorway expansion)',
		config = $json${"options":[
			{"value":"yes_specify","label":"ja, folgende","label_en":"Yes, namely"},
			{"value":"no","label":"nein","label_en":"No"},
			{"value":"cannot_assess","label":"weiß ich nicht","label_en":"I don't know"}],
			"freeTextOption":{"value":"yes_specify","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb
	WHERE questionnaire_id = qid AND key = 'nearby_construction_projects';

	UPDATE question SET "order" = 5, updated_at = NOW(),
		label = 'Sind Ihnen geplante oder mögliche Nutzungsänderungen im planungsrechtlichen Umfeld bekannt, die Auswirkungen auf Ihre Einrichtung haben könnten? (z. B. Änderung im Flächennutzungsplan, Bebauungsplan)',
		label_en = 'Are you aware of any planned or possible changes of use in the planning law context that could affect your institution? (e.g. changes to the land use plan or development plan)',
		config = $json${"options":[
			{"value":"yes_specify","label":"ja, folgende","label_en":"Yes, namely"},
			{"value":"no","label":"nein","label_en":"No"},
			{"value":"cannot_assess","label":"weiß ich nicht","label_en":"I don't know"}],
			"freeTextOption":{"value":"yes_specify","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb
	WHERE questionnaire_id = qid AND key = 'zoning_changes_known';

	UPDATE question SET "order" = 6, updated_at = NOW(),
		label = 'Wie gut sind die Räume für den aktuellen Betrieb geeignet? (z. B. Größe, Zuschnitt, Ausstattung, Nutzbarkeit etc.)'
	WHERE questionnaire_id = qid AND key = 'room_suitability';

	-- Block C: Finanzen und Betrieb -------------------------------------------
	UPDATE question SET updated_at = NOW(),
		label = 'Welche Formen der öffentlichen Förderung erhält Ihre Einrichtung derzeit überwiegend?',
		label_en = 'Which forms of public funding does your institution currently mainly receive?',
		config = $json${"options":[
			{"value":"none","label":"keine öffentliche Förderung","label_en":"No public funding"},
			{"value":"mostly_project_based","label":"überwiegend projektbezogene öffentliche Förderung","label_en":"Mainly project-based public funding"},
			{"value":"mostly_institutional","label":"überwiegend institutionelle öffentliche Förderung","label_en":"Mainly institutional public funding"},
			{"value":"mixed","label":"etwa gleichmäßige öffentliche Mischförderung","label_en":"Roughly even mix of public funding"},
			{"value":"other","label":"sonstige Form","label_en":"Other form"}],
			"freeTextOption":{"value":"other","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb
	WHERE questionnaire_id = qid AND key = 'funding_type';

	UPDATE question SET updated_at = NOW(),
		label = 'Wie würden Sie die aktuelle öffentliche Fördersituation Ihrer Einrichtung insgesamt bewerten?',
		label_en = 'How would you rate your institution''s current public funding situation overall?'
	WHERE questionnaire_id = qid AND key = 'funding_security';

	-- Block D: Sozialraum und Nachfrage ---------------------------------------
	UPDATE question SET updated_at = NOW(),
		label = 'Wie hat sich der Umfang der Nutzung Ihrer Einrichtung in den letzten drei Jahren insgesamt entwickelt? Bitte beziehen Sie sich auf die für Ihre Einrichtung passende Form der Nutzung (z. B. Besucher*innenzahlen, Teilnehmendenzahlen, Buchungen, Belegungstage oder Raumnutzungen)'
	WHERE questionnaire_id = qid AND key = 'usage_trend';

	UPDATE question SET updated_at = NOW(),
		label = 'Wie hat sich die Auslastung Ihrer Einrichtung in den letzten drei Jahren insgesamt entwickelt? Mit Auslastung ist gemeint, in welchem Umfang die verfügbaren räumlichen, zeitlichen und personellen Kapazitäten tatsächlich genutzt werden.',
		label_en = 'How has the capacity utilization of your institution developed overall in the past three years? Utilization means the extent to which the available spatial, time and staff capacities are actually used.'
	WHERE questionnaire_id = qid AND key = 'capacity_utilization_trend';

	-- New usage_data_collection takes order 2; accessibility (2) through
	-- neighborhood_conflicts_frequency (7) move to 3..8.
	UPDATE question SET "order" = "order" + 1, updated_at = NOW()
	WHERE questionnaire_id = qid AND step = 4 AND "order" >= 2;

	UPDATE question SET updated_at = NOW(),
		label = 'Wie barrierefrei ist Ihre Einrichtung nach Ihrer Einschätzung erreichbar und nutzbar?',
		label_en = 'In your assessment, how accessible is your institution to reach and use?'
	WHERE questionnaire_id = qid AND key = 'accessibility';

	UPDATE question SET updated_at = NOW(),
		label = 'In welchem Maß beeinträchtigt die Konkurrenz durch ähnliche Angebote die Nachfrage oder wirtschaftliche Situation Ihrer Einrichtung?',
		label_en = 'To what extent does competition from similar offerings affect the demand for or economic situation of your institution?'
	WHERE questionnaire_id = qid AND key = 'competition_impact';

	UPDATE question SET updated_at = NOW(),
		label = 'Wie gut ist Ihre Einrichtung in die Nachbarschaft und das kulturelle Umfeld eingebunden? (z. B. Kooperationen, Unterstützung durch Nachbarschaft)',
		label_en = 'How well is your institution integrated into the neighbourhood and its cultural surroundings? (e.g. cooperations, support from the neighbourhood)'
	WHERE questionnaire_id = qid AND key = 'neighborhood_integration';

	UPDATE question SET updated_at = NOW(),
		label = 'Wie wichtig ist der aktuelle Standort für die persönliche Beziehung Ihrer Einrichtung zur lokalen Community bzw. zum unmittelbaren Umfeld?',
		label_en = 'How important is the current location for your institution''s personal relationship with the local community or its immediate surroundings?'
	WHERE questionnaire_id = qid AND key = 'community_relation_importance';

	UPDATE question SET updated_at = NOW(),
		label = 'Wie häufig treten Nachbarschaftskonflikte (z. B. Beschwerden wegen Lärmbelästigung) mit dem Umfeld auf?',
		label_en = 'How often do neighbourhood conflicts (e.g. noise complaints) with the surroundings occur?'
	WHERE questionnaire_id = qid AND key = 'neighborhood_conflicts_frequency';

	-- Block E: Sichtbarkeit und Öffentlichkeit --------------------------------
	UPDATE question SET updated_at = NOW(),
		label = 'Wie gut ist Ihre Einrichtung nach Ihrer Einschätzung über eine allgemeine Internetsuche auffindbar?',
		label_en = 'In your assessment, how easy is it to find your institution through a general internet search?',
		config = $json${"options":[
			{"value":"1","label":"gar nicht","label_en":"Not at all"},
			{"value":"2","label":"eher schlecht","label_en":"Rather poorly"},
			{"value":"3","label":"teils/teils","label_en":"Neutral"},
			{"value":"4","label":"eher gut","label_en":"Rather well"},
			{"value":"5","label":"sehr gut","label_en":"Very well"},
			{"value":"6","label":"kann ich nicht einschätzen","label_en":"I cannot assess this"}]}$json$::jsonb
	WHERE questionnaire_id = qid AND key = 'online_findability';

	UPDATE question SET updated_at = NOW(),
		label = 'Wie aktuell sind die Informationen auf der eigenen Webseite Ihrer Einrichtung in der Regel?',
		label_en = 'How up to date is the information on your institution''s own website as a rule?',
		config = jsonb_set(config, '{options,5}', '{"value":"6","label":"keine eigene Webseite","label_en":"No website of our own"}')
	WHERE questionnaire_id = qid AND key = 'web_presence_freshness';

	UPDATE question SET updated_at = NOW(),
		label = 'Wie zuverlässig sind aktuelle Informationen zu Angeboten, Veranstaltungen oder Nutzungsmöglichkeiten Ihrer Einrichtung allgemein online verfügbar?',
		label_en = 'How reliably is up-to-date information about your institution''s offerings, events or usage options generally available online?'
	WHERE questionnaire_id = qid AND key = 'event_info_reliability';

	-- New website_findability_measures takes order 3; digital_channels and
	-- visibility_resources move to 4 and 5.
	UPDATE question SET "order" = "order" + 1, updated_at = NOW()
	WHERE questionnaire_id = qid AND step = 5 AND "order" >= 3;

	-- "eigene Webseite" is no longer offered; old answers keep the value.
	UPDATE question SET updated_at = NOW(),
		label = 'Auf welchen digitalen Kanälen oder Plattformen ist Ihre Einrichtung aktiv präsent (Aktivitäten innerhalb der letzten 3 Monate)?',
		config = $json${"options":[
			{"value":"newsletter","label":"E-Mail-Newsletter","label_en":"Email newsletter"},
			{"value":"social_networks","label":"Soziale Netzwerke (z. B. Instagram, TikTok, Facebook, Twitter)","label_en":"Social networks (e.g. Instagram, TikTok, Facebook, Twitter)"},
			{"value":"video_platforms","label":"Videoplattformen (z. B. YouTube)","label_en":"Video platforms (e.g. YouTube)"},
			{"value":"linkedin","label":"Jobplattformen (z. B. LinkedIn)","label_en":"Job platforms (e.g. LinkedIn)"},
			{"value":"messengers","label":"Messenger-Kanäle (z. B. WhatsApp)","label_en":"Messenger channels (e.g. WhatsApp)"},
			{"value":"event_culture_platforms","label":"Veranstaltungs- und Kulturplattformen (z. B. VisitBerlin, ResidentAdvisor)","label_en":"Event and culture platforms (e.g. VisitBerlin, ResidentAdvisor)"},
			{"value":"ticketing_platforms","label":"Ticketingplattformen (z. B. Eventim)","label_en":"Ticketing platforms (e.g. Eventim)"},
			{"value":"other","label":"Sonstige","label_en":"Other"},
			{"value":"none","label":"auf keinen digitalen Kanälen oder Plattformen aktiv","label_en":"Not active on any digital channels or platforms"}],
			"freeTextOption":{"value":"other","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb
	WHERE questionnaire_id = qid AND key = 'digital_channels';

	UPDATE question SET updated_at = NOW(),
		label = 'Wie ausreichend sind die personellen oder zeitlichen Ressourcen für digitale Sichtbarkeit und Öffentlichkeitsarbeit in Ihrer Einrichtung?',
		label_en = 'How sufficient are the staff or time resources for digital visibility and public relations in your institution?',
		config = jsonb_set(config, '{options,4}', '{"value":"5","label":"voll und ganz ausreichend","label_en":"Fully sufficient"}')
	WHERE questionnaire_id = qid AND key = 'visibility_resources';

	-- Block F: Globale Einschätzungen -----------------------------------------
	-- "Organisation/Personal" is no longer offered; old answers keep the value.
	UPDATE question SET updated_at = NOW(),
		config = $json${"options":[
			{"value":"location_contract","label":"Standort & Vertrag","label_en":"Location & contract"},
			{"value":"building","label":"Immobilie & Gebäude","label_en":"Property & building"},
			{"value":"finance_funding","label":"Finanzierung & Förderung","label_en":"Finance & funding"},
			{"value":"demand_environment","label":"Sozialraum & Nachfrage","label_en":"Social space & demand"},
			{"value":"visibility_public","label":"Sichtbarkeit & Öffentlichkeit","label_en":"Visibility & public relations"},
			{"value":"other","label":"Sonstiges","label_en":"Other"}],
			"freeTextOption":{"value":"other","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb
	WHERE questionnaire_id = qid AND key = 'priority_area';

	-- Block 7: Abschließende Angaben ------------------------------------------
	-- The access code fields come first; the consents move down.
	UPDATE question SET "order" = "order" + 2, updated_at = NOW()
	WHERE questionnaire_id = qid AND step = 7;

	UPDATE question SET updated_at = NOW(),
		label = 'Ich stimme zu, dass der aus meinen Angaben berechnete Kulturort-Index unter Nennung meiner Einrichtung veröffentlicht werden darf.',
		label_en = 'I agree that the Cultural Venue Index calculated from my responses may be published under the name of my institution.'
	WHERE questionnaire_id = qid AND key = 'publish_named_consent';

	-- New questions -----------------------------------------------------------
	INSERT INTO question (questionnaire_id, key, label, label_en, description, description_en, field_type, required, step, "order", config, updated_at)
	VALUES
		(qid, 'operator_type',
			'In welcher Trägerschaft arbeitet Ihre Einrichtung?',
			'Under what type of sponsorship does your institution operate?',
			NULL, NULL, 'radio', true, 0, 0,
			$json${"options":[
				{"value":"public","label":"Öffentlich (Bund, Land, Kommune)","label_en":"Public (federal, state, municipal)"},
				{"value":"non_profit","label":"Gemeinnützig / zivilgesellschaftlich","label_en":"Non-profit / civil society"},
				{"value":"private_commercial","label":"Privatwirtschaftlich (gewinnorientiert)","label_en":"Private (for-profit)"},
				{"value":"church","label":"Kirchlich","label_en":"Church"},
				{"value":"mixed","label":"Mischform / mehrere Träger","label_en":"Mixed / several sponsors"}]}$json$::jsonb,
			NOW()),
		(qid, 'current_address_since_year',
			'Seit wann befindet sich die Einrichtung an der aktuellen Adresse? (Jahreszahl)',
			'Since when has the institution been at its current address? (year)',
			NULL, NULL, 'number', true, 0, 1,
			$json${"min":1000,"max":2100,"placeholder":"z. B. 2010","placeholder_en":"e.g. 2010"}$json$::jsonb,
			NOW()),
		(qid, 'founded_year',
			'Seit wann besteht die Einrichtung insgesamt? (Jahreszahl)',
			'Since when has the institution existed overall? (year)',
			NULL, NULL, 'number', true, 0, 2,
			$json${"min":1000,"max":2100,"placeholder":"z. B. 1998","placeholder_en":"e.g. 1998"}$json$::jsonb,
			NOW()),
		(qid, 'usage_data_collection',
			'Erheben Sie Daten zur Nutzung Ihrer Angebote, Räume oder Ressourcen durch Besucher*innen bzw. Teilnehmende?',
			'Do you collect data on how visitors or participants use your offerings, premises or resources?',
			NULL, NULL, 'multiselect', true, 4, 2,
			$json${"options":[
				{"value":"visitor_counts","label":"Ja, über Besucher*innen- bzw. Teilnehmendenzahlen","label_en":"Yes, through visitor or participant numbers"},
				{"value":"bookings","label":"Ja, über Buchungen, Anmeldungen oder Reservierungen","label_en":"Yes, through bookings, registrations or reservations"},
				{"value":"occupancy","label":"Ja, über Belegungsdaten (z. B. Belegungstage, Auslastung)","label_en":"Yes, through occupancy data (e.g. days booked, utilization)"},
				{"value":"room_usage_times","label":"Ja, über Raumnutzungen oder Nutzungszeiten","label_en":"Yes, through room usage or usage times"},
				{"value":"user_surveys","label":"Ja, durch Befragungen oder Feedbackerhebungen der Nutzer","label_en":"Yes, through user surveys or feedback"},
				{"value":"none","label":"Nein, es werden keine Nutzungsdaten erhoben","label_en":"No, no usage data is collected"},
				{"value":"other","label":"Sonstiges","label_en":"Other"}],
				"freeTextOption":{"value":"other","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb,
			NOW()),
		(qid, 'free_community_use',
			'Ermöglichen Sie der lokalen Community bzw. dem unmittelbaren Umfeld eine kostenfreie Nutzung Ihrer Räume oder Ressourcen (z. B. im Rahmen von Mehrfachnutzungskonzepten)?',
			'Do you allow the local community or immediate surroundings to use your premises or resources free of charge (e.g. as part of shared-use concepts)?',
			NULL, NULL, 'radio', true, 4, 9,
			$json${"options":[
				{"value":"regularly","label":"Ja, regelmäßig","label_en":"Yes, regularly"},
				{"value":"occasionally","label":"Ja, gelegentlich/anlassbezogen","label_en":"Yes, occasionally/on specific occasions"},
				{"value":"no","label":"Nein","label_en":"No"},
				{"value":"not_possible","label":"Eine kostenfreie Nutzung ist grundsätzlich nicht möglich","label_en":"Free use is generally not possible"},
				{"value":"cannot_assess","label":"Kann ich nicht einschätzen","label_en":"I cannot assess this"}]}$json$::jsonb,
			NOW()),
		(qid, 'free_community_use_target_groups',
			'An wen richtet sich diese Nutzung?',
			'Who is this use aimed at?',
			NULL, NULL, 'multiselect', true, 4, 10,
			$json${"options":[
				{"value":"associations","label":"Vereine und Initiativen","label_en":"Associations and initiatives"},
				{"value":"neighborhood_groups","label":"Nachbarschaft bzw. lokale Gruppen","label_en":"Neighbourhood or local groups"},
				{"value":"educational_institutions","label":"Bildungseinrichtungen","label_en":"Educational institutions"},
				{"value":"social_organizations","label":"Soziale oder gemeinnützige Organisationen","label_en":"Social or non-profit organizations"},
				{"value":"other","label":"Andere","label_en":"Other"}],
				"freeTextOption":{"value":"other","placeholder":"Bitte angeben","placeholder_en":"Please specify"},
				"condition":{"dependsOnKey":"free_community_use","equals":["regularly","occasionally"]}}$json$::jsonb,
			NOW()),
		(qid, 'website_findability_measures',
			'In welchem Umfang wurden bei der Gestaltung Ihrer Website gezielt Maßnahmen berücksichtigt, um die digitale Auffindbarkeit zu verbessern?',
			'To what extent were specific measures taken into account when designing your website to improve its digital findability?',
			NULL, NULL, 'likertMatrix', true, 5, 3,
			$json${"options":[
				{"value":"1","label":"gar nicht","label_en":"Not at all"},
				{"value":"2","label":"eher wenig","label_en":"Rather little"},
				{"value":"3","label":"teilweise","label_en":"Partly"},
				{"value":"4","label":"eher stark","label_en":"Rather strongly"},
				{"value":"5","label":"sehr stark","label_en":"Very strongly"},
				{"value":"6","label":"kann ich nicht beurteilen","label_en":"I cannot assess this"}],
				"likertMatrix":{"rows":[
					{"key":"search_engines","label":"Auffindbarkeit über klassische Suchmaschinen (z. B. Google)","label_en":"Findability via classic search engines (e.g. Google)"},
					{"key":"ai_search","label":"Auffindbarkeit über KI-gestützte Suchdienste (z. B. ChatGPT, Claude etc.)","label_en":"Findability via AI-based search services (e.g. ChatGPT, Claude etc.)"}]},
				"condition":{"dependsOnKey":"web_presence_freshness","equals":["1","2","3","4","5"]}}$json$::jsonb,
			NOW()),
		(qid, 'access_code',
			'Ihr Zugangscode',
			'Your access code',
			'Alle im Kulturkataster verzeichneten Orte haben von uns einen persönlichen Zugangscode per Post und E-Mail erhalten. Er hilft uns, Ihre Angaben Ihrem Kulturort eindeutig zuzuordnen.',
			'All venues listed in the Kulturkataster have received a personal access code from us by post and email. It helps us to clearly assign your responses to your cultural venue.',
			'text', false, 7, 0, NULL,
			NOW()),
		(qid, 'no_access_code',
			'Ich habe keinen Code erhalten oder nicht zur Hand – ich möchte trotzdem teilnehmen.',
			'I have not received a code or do not have it to hand – I would still like to take part.',
			NULL, NULL, 'checkbox', false, 7, 1, NULL,
			NOW())
	ON CONFLICT (questionnaire_id, key) DO NOTHING;
END
$migration$;
