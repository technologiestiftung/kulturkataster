-- Gefährdungsradar questionnaire: proofread English texts.
-- Source: English proofreading document for the questionnaire (Kulturort-Index).
--
-- Only English columns and *_en keys change: question label_en/description_en,
-- option and likert-matrix row label_en, block title_en and the questionnaire
-- title_en/description_en. Option values and German texts stay untouched, so
-- stored answers stay valid. Every question is set explicitly, so re-running
-- the migration gives the same result.
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

	UPDATE questionnaire
	SET title_en = 'Survey on the Berlin Kulturort-Index (Cultural Location Index)',
		description_en = 'Scientific survey to develop the Kulturort-Index for Berlin''s cultural locations.',
		meta_data = (
			SELECT jsonb_set(meta_data::jsonb, '{blocks}', jsonb_object_agg(
				b.key,
				b.value || CASE WHEN t.title_en IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('title_en', t.title_en) END))
			FROM jsonb_each(meta_data::jsonb -> 'blocks') AS b(key, value)
			LEFT JOIN (VALUES
				('0', 'General Information'),
				('1', 'Block A: Location and Contractual Arrangements'),
				('2', 'Block B: Property and Building Conditions'),
				('3', 'Block C: Financial and Operational Situation'),
				('4', 'Block D: Neighborhood Context and Demand'),
				('5', 'Block E: Visibility and Public Outreach'),
				('6', 'Block F: Overall Assessments'),
				('7', 'Final Information')
			) AS t(key, title_en) ON t.key = b.key
		),
		updated_at = NOW()
	WHERE id = qid;

	-- opts maps option value -> label_en, rows maps likert-matrix row key -> label_en.
	-- Options and rows missing from a map keep their current label_en.
	CREATE TEMP TABLE en_texts (key text PRIMARY KEY, label_en text, description_en text, opts jsonb, rows jsonb) ON COMMIT DROP;
	INSERT INTO en_texts VALUES
	-- General information
	('operator_type', 'Which of the following best describes how your cultural organization is operated?', NULL,
		$j${"public":"Public sector (federal, state, or local government)","non_profit":"Non-profit / civil society organization","private_commercial":"Private sector (for-profit)","church":"Church or religious organization","mixed":"Mixed structure / multiple operators","informal":"Informal / no formal operating organization","other":"Other:"}$j$, NULL),
	('current_address_since_year', 'Since what year has your organization been based at its current address?', NULL, NULL, NULL),
	('founded_year', 'In what year was your organization originally established?', NULL, NULL, NULL),
	-- Block A: Location and contractual arrangements
	('room_usage', 'On what basis does your organization use its current premises?', NULL,
		$j${"ownership":"Ownership","rent_regular":"Standard rental agreement","rent_sublet":"Sublease","rent_temporary":"Temporary use arrangement","rent_no_contract":"Use without a written agreement","rent_leasehold":"Hereditary building right (leasehold)","rent_other":"Other:"}$j$, NULL),
	('rental_stability', 'Overall, how stable do you consider your rental or use arrangement to be?', NULL,
		$j${"1":"Very unstable","2":"Somewhat unstable","3":"Neither stable nor unstable","4":"Somewhat stable","5":"Very stable"}$j$, NULL),
	('ownership_change', 'Has the building changed ownership in the past five years?', NULL,
		$j${"yes":"Yes","no":"No","unknown":"Don't know"}$j$, NULL),
	('contract_remaining_term', 'How much time remains on your current rental or use agreement?', NULL,
		$j${"no_written_contract":"No written agreement","contract_expired":"Rental agreement has expired","under_6_months":"Less than 6 months","6_to_12_months":"6 to less than 12 months","1_to_2_years":"1 to less than 2 years","2_to_5_years":"2 to less than 5 years","5_years_or_more":"5 years or more","unlimited":"Open-ended agreement","unknown":"Not known"}$j$, NULL),
	('notice_period', 'What is the standard notice period for terminating the agreement?', NULL,
		$j${"no_contractual_notice_period":"No contractually agreed notice period","under_3_months":"Less than 3 months","3_to_6_months":"3 to less than 6 months","6_to_12_months":"6 to less than 12 months","12_months_or_more":"12 months or more","unknown":"Not known"}$j$, NULL),
	('eviction_notice', 'Have you currently received a notice of termination, a threat of eviction, or an eviction lawsuit?', NULL,
		$j${"yes":"Yes","no":"No","unclear":"Unclear"}$j$, NULL),
	('rent_model', 'Which rental arrangement applies to your organization?', NULL,
		$j${"fixed_rent":"Fixed rent","graduated_rent":"Stepped rent (scheduled increases)","index_rent":"Index-linked rent","usage_based_rent":"Usage-based rent","no_regular_rental":"No standard rental agreement","unknown":"Not known","other":"Other:"}$j$, NULL),
	('rent_development', 'How has your rent changed over the past three years?', NULL,
		$j${"1":"Decreased significantly","2":"Decreased slightly","3":"Stayed the same","4":"Increased slightly","5":"Increased significantly","6":"Not known"}$j$, NULL),
	('location_dependency', 'To what extent does your organization depend on remaining at its current location because there are no realistic alternatives?', NULL,
		$j${"1":"Not at all","2":"To a limited extent","3":"To some extent","4":"To a considerable extent","5":"To a very great extent"}$j$, NULL),
	-- Block B: Property and building conditions
	('building_condition', 'Overall, how would you rate the physical condition of the building?', NULL,
		$j${"1":"Very good","2":"Somewhat good","3":"Neither good nor poor","4":"Somewhat poor","5":"Very poor"}$j$, NULL),
	('building_construction_period', 'During which period was most of the building constructed?', NULL,
		$j${"before_1900":"Before 1900","1900_1945":"1900–1945","1946_1979":"1946–1979","1980_1999":"1980–1999","2000_or_later":"2000 or later","unknown":"Not known"}$j$, NULL),
	('renovation_pressure', 'In your view, is there currently significant pressure to renovate or a substantial need to modernize the building (e.g., a leaking roof, outdated heating system, or dampness)?', NULL,
		$j${"yes_high":"Yes, to a great extent","yes_partially":"Yes, to some extent","no":"No","unknown":"Not known"}$j$, NULL),
	('alternative_use_planned', 'Are you aware of any indications that a different use may be planned for your building or property?', NULL,
		$j${"yes_specify":"Yes, the following:","no":"No, not to my knowledge","unclear":"Unclear"}$j$, NULL),
	('nearby_construction_projects', 'Are you aware of any planned construction projects in the immediate vicinity that could negatively affect your organization''s location (e.g., luxury renovations, new developments, or highway expansion)?', NULL,
		$j${"yes_specify":"Yes, the following:","no":"No","cannot_assess":"Don't know"}$j$, NULL),
	('zoning_changes_known', 'Are you aware of any planned or potential changes to land use or planning regulations in the surrounding area that could affect your organization (e.g., changes to the land-use plan or a development plan)?', NULL,
		$j${"yes_specify":"Yes, the following:","no":"No","cannot_assess":"Don't know"}$j$, NULL),
	('room_suitability', 'How suitable are the premises for your organization''s current activities (e.g., size, layout, facilities, and usability)?', NULL,
		$j${"1":"Very suitable","2":"Somewhat suitable","3":"Neither suitable nor unsuitable","4":"Somewhat unsuitable","5":"Very unsuitable"}$j$, NULL),
	-- Block C: Financial and operational situation
	('funding_type', 'What type of public funding does your organization currently receive, if any?', NULL,
		$j${"none":"No public funding","mostly_project_based":"Predominantly project-based public funding","mostly_institutional":"Predominantly institutional public funding","mixed":"Approximately equal amounts of different types of public funding","other":"Other type:"}$j$, NULL),
	('funding_security', 'Overall, how secure do you consider your organization''s current public funding situation?', NULL,
		$j${"1":"Very insecure","2":"Somewhat insecure","3":"Neither secure nor insecure","4":"Somewhat secure","5":"Very secure"}$j$, NULL),
	('funding_source_importance', 'Please provide a rough assessment of how important each of the following funding sources is to your organization.', NULL,
		$j${"1":"Not important at all","2":"Not very important","3":"Moderately important","4":"Somewhat important","5":"Very important"}$j$,
		$j${"public_funding":"Public funding","own_income":"Earned income","donations":"Donations","sponsoring":"Sponsorship","reserves":"Financial reserves","other_income":"Other income"}$j$),
	('financial_situation_trend', 'How has your organization''s financial situation developed over the past three years?', NULL,
		$j${"1":"Deteriorated significantly","2":"Deteriorated somewhat","3":"Stayed the same","4":"Improved somewhat","5":"Improved significantly"}$j$, NULL),
	('financial_situation_current', 'Overall, how would you rate your organization''s current financial situation?', NULL,
		$j${"1":"Very poor","2":"Somewhat poor","3":"Neither good nor poor","4":"Somewhat good","5":"Very good"}$j$, NULL),
	('financial_outlook', 'How do you expect your organization''s financial situation to develop over the next three years?', NULL,
		$j${"1":"Very negatively","2":"Somewhat negatively","3":"Neither positively nor negatively","4":"Somewhat positively","5":"Very positively"}$j$, NULL),
	('staffing_level', 'Overall, how would you rate your organization''s staffing levels?', NULL,
		$j${"1":"Completely inadequate","2":"Somewhat inadequate","3":"Neither adequate nor inadequate","4":"Somewhat adequate","5":"Fully adequate"}$j$, NULL),
	('key_person_dependency', 'To what extent do your organization''s day-to-day operations depend on individual key people?', NULL,
		$j${"1":"Not at all","2":"To a limited extent","3":"To some extent","4":"To a considerable extent","5":"To a very great extent"}$j$, NULL),
	-- Block D: Neighborhood context and demand
	('usage_trend', 'How has the overall level of use of your organization developed over the past three years?',
		'Please consider whichever measure of use is most appropriate for your organization (e.g., visitor numbers, participant numbers, bookings, days of occupancy, or use of rooms).',
		$j${"1":"Decreased significantly","2":"Decreased somewhat","3":"Remained largely unchanged","4":"Increased somewhat","5":"Increased significantly","6":"Cannot be assessed"}$j$, NULL),
	('capacity_utilization_trend', 'How has your organization''s overall capacity utilization changed over the past three years?',
		'Capacity utilization refers to the extent to which available space, time, and staffing resources are actually used.',
		$j${"1":"Decreased significantly","2":"Decreased somewhat","3":"Remained largely unchanged","4":"Increased somewhat","5":"Increased significantly","6":"Cannot be assessed","7":"Not meaningful to assess for our organization"}$j$, NULL),
	('usage_data_collection', 'Do you collect data on how visitors or participants use your programs, spaces, or resources?', NULL,
		$j${"visitor_counts":"Yes, through visitor or participant numbers","bookings":"Yes, through bookings, registrations, or reservations","occupancy":"Yes, through occupancy data (e.g., days of occupancy or capacity utilization)","room_usage_times":"Yes, through room usage or times of use","user_surveys":"Yes, through user surveys or feedback collection","none":"No, we do not collect usage data","other":"Other:"}$j$, NULL),
	('accessibility', 'In your assessment, how accessible is your organization in terms of reaching and using its facilities?', NULL,
		$j${"1":"Not accessible at all","2":"Not very accessible","3":"Partially accessible","4":"Mostly accessible","5":"Highly accessible"}$j$, NULL),
	('location_quality', 'Overall, how would you rate the location of your organization (e.g., general accessibility, position within the city, and proximity to target groups)?', NULL,
		$j${"1":"Very unfavorable","2":"Somewhat unfavorable","3":"Neither favorable nor unfavorable","4":"Somewhat favorable","5":"Very favorable"}$j$, NULL),
	('competition_impact', 'To what extent does competition from similar offerings negatively affect demand for your organization''s activities or its financial situation?', NULL,
		$j${"1":"Not at all","2":"To a limited extent","3":"To some extent","4":"To a considerable extent","5":"To a very great extent","6":"Similar offerings are not perceived as competition"}$j$, NULL),
	('neighborhood_integration', 'How well is your organization connected to the surrounding neighborhood and cultural community (e.g., through partnerships or neighborhood support)?', NULL,
		$j${"1":"Not at all","2":"Not very well","3":"To some extent","4":"Fairly well","5":"Very well","6":"Not relevant or cannot be assessed for our organization"}$j$, NULL),
	('community_relation_importance', 'How important is your current location to your organization''s relationship with the local community or immediate neighborhood?', NULL,
		$j${"1":"Not important at all","2":"Not very important","3":"Moderately important","4":"Somewhat important","5":"Very important","6":"Not relevant or cannot be assessed for our organization"}$j$, NULL),
	('neighborhood_conflicts_frequency', 'How often do conflicts with the surrounding neighborhood occur (e.g., complaints about noise)?', NULL,
		$j${"1":"Never","2":"Rarely","3":"Occasionally","4":"Often","5":"Very often"}$j$, NULL),
	('free_community_use', 'Do you allow members of the local community or immediate neighborhood to use your spaces or resources free of charge (e.g., as part of shared-use arrangements)?', NULL,
		$j${"regularly":"Yes, regularly","occasionally":"Yes, occasionally / for specific occasions","no":"No","not_possible":"Free use is generally not possible","cannot_assess":"Cannot assess"}$j$, NULL),
	('free_community_use_target_groups', 'Who is this use intended for?', NULL,
		$j${"associations":"Associations and initiatives","neighborhood_groups":"Neighborhood residents or local groups","educational_institutions":"Educational institutions","social_organizations":"Social or non-profit organizations","other":"Other:"}$j$, NULL),
	-- Block E: Visibility and public outreach
	('online_findability', 'In your assessment, how easy is it to find your organization through a general internet search?', NULL,
		$j${"1":"Not at all","2":"Somewhat difficult to find","3":"Neither easy nor difficult","4":"Somewhat easy to find","5":"Very easy to find","6":"Cannot assess"}$j$, NULL),
	('web_presence_freshness', 'How up to date is the information on your organization''s own website, as a rule?', NULL,
		$j${"1":"Very rarely up to date","2":"Rarely up to date","3":"Sometimes up to date","4":"Usually up to date","5":"Very up to date","6":"No website of our own"}$j$, NULL),
	('event_info_reliability', 'How reliably can current information about your organization''s offerings, events, or opportunities to use its facilities be found online?', NULL,
		$j${"1":"Not reliably at all","2":"Somewhat unreliably","3":"Neither reliably nor unreliably","4":"Somewhat reliably","5":"Very reliably","6":"Not applicable"}$j$, NULL),
	('website_findability_measures', 'To what extent were specific measures to improve online discoverability taken into account when designing your website?', NULL,
		$j${"1":"Not at all","2":"To a limited extent","3":"To some extent","4":"To a considerable extent","5":"To a very great extent","6":"Cannot assess"}$j$,
		$j${"search_engines":"Discoverability through traditional search engines (e.g., Google)","ai_search":"Discoverability through AI-powered search services (e.g., ChatGPT or Claude)"}$j$),
	('digital_channels', 'On which digital channels or platforms has your organization been actively present in the past three months?', NULL,
		$j${"newsletter":"Email newsletters","social_networks":"Social media (e.g., Instagram, TikTok, Facebook, or Twitter)","video_platforms":"Video platforms (e.g., YouTube)","linkedin":"Professional networking and job platforms (e.g., LinkedIn)","messengers":"Messaging channels (e.g., WhatsApp)","event_culture_platforms":"Event and cultural platforms (e.g., visitBerlin or Resident Advisor)","ticketing_platforms":"Ticketing platforms (e.g., Eventim)","other":"Other:","none":"Not active on any digital channels or platforms"}$j$, NULL),
	('visibility_resources', 'How adequate are your organization''s staff and time resources for online visibility and public outreach?', NULL,
		$j${"1":"Not at all adequate","2":"Somewhat inadequate","3":"Neither adequate nor inadequate","4":"Somewhat adequate","5":"Fully adequate"}$j$, NULL),
	-- Block F: Overall assessments
	('future_risk', 'Overall, how at risk do you consider the future of your organization at its current location to be?', NULL,
		$j${"1":"Not at risk at all","2":"At relatively low risk","3":"At moderate risk","4":"At relatively high risk","5":"At very high risk"}$j$, NULL),
	('location_loss_probability', 'How likely is it that your organization will lose its current location within the next two years?', NULL,
		$j${"1":"Very unlikely","2":"Somewhat unlikely","3":"Uncertain","4":"Somewhat likely","5":"Very likely"}$j$, NULL),
	('operation_reduction_probability', 'How likely is it that your organization will have to significantly reduce its operations or offerings within the next two years?', NULL,
		$j${"1":"Very unlikely","2":"Somewhat unlikely","3":"Uncertain","4":"Somewhat likely","5":"Very likely"}$j$, NULL),
	('priority_area', 'In which area do you currently see the greatest need for action?', NULL,
		$j${"location_contract":"Location and contractual arrangements","building":"Property and building conditions","finance_funding":"Financing and funding","demand_environment":"Neighborhood context and demand","visibility_public":"Visibility and public outreach","other":"Other:"}$j$, NULL),
	-- Final information
	('access_code', 'Your access code',
		'We have sent a personal access code by post and email to all cultural locations listed in the Kulturkataster. This code helps us match your responses to your cultural location unambiguously.',
		NULL, NULL),
	('no_access_code', 'I have not received a code or do not have it available, but I would still like to take part.', NULL, NULL, NULL),
	('publish_named_consent', 'I agree that the Kulturort-Index score calculated from my responses may be published together with the name of my organization.', NULL, NULL, NULL);

	UPDATE question q
	SET label_en = t.label_en,
		description_en = COALESCE(t.description_en, q.description_en),
		updated_at = NOW()
	FROM en_texts t
	WHERE q.questionnaire_id = qid AND q.key = t.key;

	UPDATE question q
	SET config = jsonb_set(q.config, '{options}', (
			SELECT jsonb_agg(
				opt || CASE WHEN t.opts ? (opt ->> 'value')
					THEN jsonb_build_object('label_en', t.opts ->> (opt ->> 'value'))
					ELSE '{}'::jsonb END
				ORDER BY idx)
			FROM jsonb_array_elements(q.config -> 'options') WITH ORDINALITY AS o(opt, idx)
		))
	FROM en_texts t
	WHERE q.questionnaire_id = qid AND q.key = t.key
		AND t.opts IS NOT NULL
		AND jsonb_typeof(q.config -> 'options') = 'array';

	UPDATE question q
	SET config = jsonb_set(q.config, '{likertMatrix,rows}', (
			SELECT jsonb_agg(
				row_item || CASE WHEN t.rows ? (row_item ->> 'key')
					THEN jsonb_build_object('label_en', t.rows ->> (row_item ->> 'key'))
					ELSE '{}'::jsonb END
				ORDER BY idx)
			FROM jsonb_array_elements(q.config -> 'likertMatrix' -> 'rows') WITH ORDINALITY AS r(row_item, idx)
		))
	FROM en_texts t
	WHERE q.questionnaire_id = qid AND q.key = t.key
		AND t.rows IS NOT NULL
		AND jsonb_typeof(q.config -> 'likertMatrix' -> 'rows') = 'array';
END
$migration$;
