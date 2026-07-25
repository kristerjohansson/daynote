import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Box, Stack } from '@mui/material';
import { note } from '../database/notes';
import { RecurringAnniversary, getDayMonthKeyFromDate } from '../database/anniversaries';

interface DayRowProps {
  date: Date;
  noteData?: note;
  anniversaryData?: RecurringAnniversary;
}

const DayRow: React.FC<DayRowProps> = ({ date, noteData, anniversaryData }: DayRowProps) => {
  const dateWithoutTime = useMemo(() => new Date(date.getFullYear(), date.getMonth(), date.getDate()), [date]);
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const effectiveNoteData = noteData ?? { date: date.valueOf(), note: '', photo: '' };
  const effectiveAnniversaryData = anniversaryData ?? {
    dayMonthKey: getDayMonthKeyFromDate(dateWithoutTime),
    items: [],
    note: '',
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Link
        to={`/day/${dateWithoutTime.valueOf()}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 600, mb: 0.5 }}>
          {date.toLocaleDateString()}
        </Typography>
        <Stack direction="row" sx={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
          <Stack direction="row" sx={{ gap: 0.5, mt: '4px', flexShrink: 0 }}>
            {date.toLocaleDateString() === today.toLocaleDateString() && (
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
            )}
            {effectiveAnniversaryData.note && (
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'secondary.main' }} />
            )}
          </Stack>
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            {effectiveAnniversaryData.note}
          </Typography>
          {effectiveNoteData.photo && (
            <Box
              component="img"
              src={effectiveNoteData.photo}
              alt={`Note for ${date.toLocaleDateString()}`}
              sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          <Typography variant="body2" sx={{ minWidth: 0, flex: '1 1 auto', wordBreak: 'break-word' }}>
            {effectiveNoteData.note}
          </Typography>
        </Stack>
      </Link>
    </Box>
  );
};

export default DayRow;
