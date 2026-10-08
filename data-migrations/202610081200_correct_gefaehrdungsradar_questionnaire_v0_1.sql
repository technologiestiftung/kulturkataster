-- Corrections to the Gefährdungsradar questionnaire v0.1 from the review of
-- the updated questionnaire:
--   - every answer option and likert-matrix row starts with a capital letter,
--   - answer options with a free-text field end with a colon,
--   - block A asks for the notice period before an eviction notice,
--   - block D questions 1 and 2 keep their explanation only in the
--     description, not repeated in the question itself.
--
-- Some databases had question order and descriptions edited by hand, so this
-- migration sets order and descriptions explicitly instead of shifting them.
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

	-- Capitalize option labels and append a colon to free-text options.
	UPDATE question q
	SET config = jsonb_set(q.config, '{options}', (
			SELECT jsonb_agg(
				opt
				|| jsonb_build_object('label', fixed.label)
				|| CASE WHEN opt ? 'label_en'
					THEN jsonb_build_object('label_en', fixed.label_en)
					ELSE '{}'::jsonb END
				ORDER BY idx)
			FROM jsonb_array_elements(q.config -> 'options') WITH ORDINALITY AS o(opt, idx)
			CROSS JOIN LATERAL (
				SELECT
					upper(left(opt ->> 'label', 1)) || substr(opt ->> 'label', 2)
						|| CASE WHEN is_free_text AND right(opt ->> 'label', 1) <> ':' THEN ':' ELSE '' END AS label,
					upper(left(opt ->> 'label_en', 1)) || substr(opt ->> 'label_en', 2)
						|| CASE WHEN is_free_text AND right(opt ->> 'label_en', 1) <> ':' THEN ':' ELSE '' END AS label_en
				FROM (SELECT (opt ->> 'value') = (q.config -> 'freeTextOption' ->> 'value') AS is_free_text) AS f
			) AS fixed
		)),
		updated_at = NOW()
	WHERE q.questionnaire_id = qid
		AND jsonb_typeof(q.config -> 'options') = 'array'
		AND jsonb_array_length(q.config -> 'options') > 0;

	-- Capitalize likert-matrix row labels (e.g. "sonstige Einnahmen").
	UPDATE question q
	SET config = jsonb_set(q.config, '{likertMatrix,rows}', (
			SELECT jsonb_agg(
				row_item
				|| jsonb_build_object('label', upper(left(row_item ->> 'label', 1)) || substr(row_item ->> 'label', 2))
				|| CASE WHEN row_item ? 'label_en'
					THEN jsonb_build_object('label_en', upper(left(row_item ->> 'label_en', 1)) || substr(row_item ->> 'label_en', 2))
					ELSE '{}'::jsonb END
				ORDER BY idx)
			FROM jsonb_array_elements(q.config -> 'likertMatrix' -> 'rows') WITH ORDINALITY AS r(row_item, idx)
		)),
		updated_at = NOW()
	WHERE q.questionnaire_id = qid
		AND jsonb_typeof(q.config -> 'likertMatrix' -> 'rows') = 'array';

	-- Block D: explanation only in the description.
	UPDATE question SET updated_at = NOW(),
		label = 'Wie hat sich der Umfang der Nutzung Ihrer Einrichtung in den letzten drei Jahren insgesamt entwickelt?',
		label_en = 'How has the extent of use of your institution developed overall in the past three years?',
		description = 'Bitte beziehen Sie sich auf die für Ihre Einrichtung passende Form der Nutzung (z. B. Besucher*innenzahlen, Teilnehmendenzahlen, Buchungen, Belegungstage oder Raumnutzungen).',
		description_en = 'Please refer to the form of use that fits your institution (e.g. visitor or participant numbers, bookings, days booked or room usage).'
	WHERE questionnaire_id = qid AND key = 'usage_trend';

	UPDATE question SET updated_at = NOW(),
		label = 'Wie hat sich die Auslastung Ihrer Einrichtung in den letzten drei Jahren insgesamt entwickelt?',
		label_en = 'How has the capacity utilization of your institution developed overall in the past three years?',
		description = 'Mit Auslastung ist gemeint, in welchem Umfang die verfügbaren räumlichen, zeitlichen und personellen Kapazitäten tatsächlich genutzt werden.',
		description_en = 'Utilization means the extent to which the available spatial, time and staff capacities are actually used.'
	WHERE questionnaire_id = qid AND key = 'capacity_utilization_trend';

	-- Explicit order for every question (block A: notice period before eviction).
	UPDATE question q
	SET step = v.step, "order" = v.ord, updated_at = NOW()
	FROM (VALUES
		('operator_type', 0, 0),
		('current_address_since_year', 0, 1),
		('founded_year', 0, 2),
		('room_usage', 1, 0),
		('rental_stability', 1, 1),
		('ownership_change', 1, 2),
		('contract_remaining_term', 1, 3),
		('notice_period', 1, 4),
		('eviction_notice', 1, 5),
		('rent_model', 1, 6),
		('rent_development', 1, 7),
		('location_dependency', 1, 8),
		('building_condition', 2, 0),
		('building_construction_period', 2, 1),
		('renovation_pressure', 2, 2),
		('alternative_use_planned', 2, 3),
		('nearby_construction_projects', 2, 4),
		('zoning_changes_known', 2, 5),
		('room_suitability', 2, 6),
		('funding_type', 3, 0),
		('funding_security', 3, 1),
		('funding_source_importance', 3, 2),
		('financial_situation_trend', 3, 3),
		('financial_situation_current', 3, 4),
		('financial_outlook', 3, 5),
		('staffing_level', 3, 6),
		('key_person_dependency', 3, 7),
		('usage_trend', 4, 0),
		('capacity_utilization_trend', 4, 1),
		('usage_data_collection', 4, 2),
		('accessibility', 4, 3),
		('location_quality', 4, 4),
		('competition_impact', 4, 5),
		('neighborhood_integration', 4, 6),
		('community_relation_importance', 4, 7),
		('neighborhood_conflicts_frequency', 4, 8),
		('free_community_use', 4, 9),
		('free_community_use_target_groups', 4, 10),
		('online_findability', 5, 0),
		('web_presence_freshness', 5, 1),
		('event_info_reliability', 5, 2),
		('website_findability_measures', 5, 3),
		('digital_channels', 5, 4),
		('visibility_resources', 5, 5),
		('future_risk', 6, 0),
		('location_loss_probability', 6, 1),
		('operation_reduction_probability', 6, 2),
		('priority_area', 6, 3),
		('access_code', 7, 0),
		('no_access_code', 7, 1),
		('publish_named_consent', 7, 2)
	) AS v(key, step, ord)
	WHERE q.questionnaire_id = qid AND q.key = v.key;
END
$migration$;
