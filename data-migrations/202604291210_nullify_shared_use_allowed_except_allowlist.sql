UPDATE institution
SET shared_use_allowed = NULL
WHERE name NOT LIKE '%Kunstwerkstätten / Jugendtheateretage%'
  AND name NOT LIKE '%PomPin Salsa%'
  AND name NOT LIKE '%Theaterlaborberlin e.V.%'
  AND name NOT LIKE '%exploratorium berlin%'
  AND name NOT LIKE '%Breitenbachstraße 34-36%'
  AND name NOT LIKE '%Traumreparatur%'
  AND name NOT LIKE '%Die kleine Nachtrevue%'
  AND name NOT LIKE '%Blockpark447%'
  AND name NOT LIKE '%Blocklab447%';