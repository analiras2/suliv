-- Enable unaccent extension for accent-insensitive search
-- Required by REC-02: searching "feijao" must find "feijão"
CREATE EXTENSION IF NOT EXISTS unaccent;
