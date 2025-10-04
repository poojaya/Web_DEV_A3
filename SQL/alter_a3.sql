USE charityevents_db;

-- 1) New table to store ticket purchases (a.k.a. registrations)
CREATE TABLE IF NOT EXISTS registrations (
  registration_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id        INT NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(50),
  tickets         INT NOT NULL DEFAULT 1,
  registered_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- A user (by email) can register ONCE per event; but can buy multiple tickets
  UNIQUE KEY uniq_event_email (event_id, email),
  CONSTRAINT fk_reg_event
    FOREIGN KEY (event_id) REFERENCES events(event_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 2) Optional: seed ~10 rows
INSERT INTO registrations (event_id, full_name, email, phone, tickets)
VALUES
  (1, 'Alex Green',  'alex@example.com', '0400 000 001', 2),
  (1, 'Priya Shah',  'priya@example.com','0400 000 002', 1),
  (2, 'Liam Wong',   'liam@example.com', '0400 000 003', 3),
  (2, 'Sara Miles',  'sara@example.com', '0400 000 004', 2),
  (3, 'Jon Park',    'jon@example.com',  '0400 000 005', 1),
  (3, 'Mina Rai',    'mina@example.com', '0400 000 006', 2),
  (4, 'Ben Tran',    'ben@example.com',  '0400 000 007', 1),
  (5, 'Olivia Cho',  'olivia@example.com','0400 000 008', 2),
  (6, 'Grace Lee',   'grace@example.com','0400 000 009', 1),
  (7, 'Tom Reed',    'tom@example.com',  '0400 000 010', 1);
