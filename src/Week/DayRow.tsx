import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Circle from '@mui/icons-material/Circle';
import { note } from '../database/notes';
import { anniversary } from '../database/anniversaries';
import { DaynotedataClient, init } from '../database';

interface DayRowProps {
  date: Date;
}

const DayRow: React.FC<DayRowProps> = ({ date }: DayRowProps) => {
  const [database, setDatabase] = useState<DaynotedataClient>();
  const dateWithoutTime = useMemo(() => new Date(date.getFullYear(), date.getMonth(), date.getDate()), [date]);
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const [noteData, setNoteData] = useState<note>({ date: date.valueOf(), note: '', photo: '' });
  const [anniversaryData, setAnniversaryData] = useState<anniversary>({ date: dateWithoutTime.valueOf(), note: '' });

  useEffect(() => {
    init()
      .then(db => {
        setDatabase(db);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (database) {
      database.notes
        .get(date.valueOf())
        .then(n => setNoteData(n))
        .catch(console.error);
      database.anniversaries
        .get(dateWithoutTime.valueOf())
        .then(a => setAnniversaryData(a))
        .catch(console.error);
    }
  }, [database, date, dateWithoutTime]);

  return (
    <Box width="100%">
      <Link to={`/day/${dateWithoutTime.valueOf()}`} style={{ textDecoration: 'none' }}>
        <Typography variant="body1">{date.toLocaleDateString()}</Typography>
        <Stack direction="row" alignItems="center" gap={1}>
          <Stack direction="column" alignContent="space-around" minWidth="20px" minHeight="40px">
            {date.toLocaleDateString() === today.toLocaleDateString() && <Circle color="primary" fontSize="small" />}
            {anniversaryData.note && <Circle color="secondary" fontSize="small" />}
          </Stack>
          <Typography variant="body2" fontStyle="italic">
            {anniversaryData.note}
          </Typography>
          <Typography variant="body2">{noteData.note}</Typography>
        </Stack>
      </Link>
    </Box>
  );
};

export default DayRow;
