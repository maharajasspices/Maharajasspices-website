-- Update pickup location address for Waterfall store
UPDATE pickup_locations
SET 
  address = 'Unit 17, 10 A, Rockwood Business Park, Woodlands Dr',
  city = 'Waterfall, Durban, 3610'
WHERE name = 'Waterfall Store';