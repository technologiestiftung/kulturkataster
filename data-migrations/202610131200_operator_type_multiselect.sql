-- Gefährdungsradar questionnaire: the Trägerschaft question (operator_type)
-- becomes a multiple choice question and gets the options "Informell / keine
-- Trägerschaft" and "Sonstige:" with a free-text field, as suggested in the
-- scientific review of the questionnaire.
--
-- Existing option values are kept. Stored radio answers are plain strings,
-- multiselect answers are arrays, so existing answers are wrapped in an array.
--
-- The whole migration is one DO block because the runner executes each SQL
-- file as a single statement.

DO $migration$
DECLARE
	qid integer;
BEGIN
	SELECT id INTO qid FROM questionnaire
	WHERE title = 'Befragung zum Gefährdungsradar von Berliner Kulturorten';

	IF qid IS NULL THEN
		RAISE NOTICE 'Gefährdungsradar questionnaire not found, nothing to update';
		RETURN;
	END IF;

	UPDATE question SET field_type = 'multiselect', updated_at = NOW(),
		config = $json${"options":[
			{"value":"public","label":"Öffentlich (Bund, Land, Kommune)","label_en":"Public (federal, state, municipal)"},
			{"value":"non_profit","label":"Gemeinnützig / zivilgesellschaftlich","label_en":"Non-profit / civil society"},
			{"value":"private_commercial","label":"Privatwirtschaftlich (gewinnorientiert)","label_en":"Private (for-profit)"},
			{"value":"church","label":"Kirchlich","label_en":"Church"},
			{"value":"mixed","label":"Mischform / mehrere Träger","label_en":"Mixed / several sponsors"},
			{"value":"informal","label":"Informell / keine Trägerschaft","label_en":"Informal / no sponsorship"},
			{"value":"other","label":"Sonstige:","label_en":"Other:"}],
			"freeTextOption":{"value":"other","placeholder":"Bitte angeben","placeholder_en":"Please specify"}}$json$::jsonb
	WHERE questionnaire_id = qid AND key = 'operator_type';

	UPDATE answer a SET value = jsonb_build_array(a.value), updated_at = NOW()
	FROM question q
	WHERE q.id = a.question_id
		AND q.questionnaire_id = qid
		AND q.key = 'operator_type'
		AND jsonb_typeof(a.value) = 'string';
END
$migration$;
