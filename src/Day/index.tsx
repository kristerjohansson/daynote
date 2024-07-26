import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Params, useLoaderData } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import TodayIcon from '@mui/icons-material/TodayRounded';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIosRounded';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import { DaynotedataClient, init } from '../database';
import { note } from '../database/notes';
import { anniversary } from '../database/anniversaries';
import { getWeekNumber } from '../Week/DateExtensions';
import ImagePicker, { ImagePickerConf } from './ImagePicker';

export async function loader({ params }: { params: Params }) {
  const day = params['day'] ?? '';
  return { day };
}

const Day: React.FC = () => {
  const { day } = useLoaderData() as { day: string };
  const date = useMemo(() => new Date(Number(day)), [day]);

  const currentWeek = useMemo(() => `${date.getFullYear()}w${getWeekNumber(date)}`, [date]);

  const previousDay = useMemo(() => Number(day) - 86400000, [day]);
  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const nextDay = useMemo(() => Number(day) + 86400000, [day]);

  const [database, setDatabase] = useState<DaynotedataClient>();
  const dateWithoutTime = useMemo(() => new Date(date.getFullYear(), date.getMonth(), date.getDate()), [date]);
  const [noteData, setNoteData] = useState<note>({ date: date.valueOf(), note: '', photo: '' });
  const [anniversaryData, setAnniversaryData] = useState<anniversary>({ date: dateWithoutTime.valueOf(), note: '' });

  const config: ImagePickerConf = {
    borderRadius: '8px',
    language: 'en',
    width: '330px',
    height: '250px',
    objectFit: 'contain',
    compressInitial: null,
  };
  const initialImage = '';

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

  const handleAnniversaryChange = useCallback(
    (value: string) => {
      if (database) {
        database.anniversaries
          .put({ date: dateWithoutTime.valueOf(), note: value })
          .then(a => setAnniversaryData(a))
          .catch(e => {
            console.error(e);
            setAnniversaryData({ date: dateWithoutTime.valueOf(), note: '' });
          });
      }
    },
    [database, dateWithoutTime],
  );

  const handleNoteChange = useCallback(
    (value: string) => {
      if (database) {
        database.notes
          .put({ date: dateWithoutTime.valueOf(), note: value, photo: '' })
          .then(a => setNoteData(a))
          .catch(e => {
            console.error(e);
            setNoteData({ date: dateWithoutTime.valueOf(), note: '', photo: '' });
          });
      }
    },
    [database, dateWithoutTime],
  );

  return (
    <Stack alignItems="center" height="100%" width="100%">
      <Paper sx={{ width: '100%', borderRadius: 0 }} elevation={0}>
        <Stack direction="row" alignItems="center" width="100%">
          <BottomNavigationAction
            label={currentWeek}
            icon={<ArrowBackIosIcon />}
            href={`/week/${currentWeek}`}
            showLabel
            style={{ maxWidth: '80px' }}
          />
          <Typography variant="h6" margin={1} paddingRight={'80px'} flex={'1 1 auto'} textAlign="center">
            {date.toLocaleDateString()}
          </Typography>
        </Stack>
      </Paper>
      <Divider orientation="horizontal" variant="fullWidth" sx={{ width: '100%' }} />
      <Stack alignItems="center" height="100%" width="100%" padding={1}>
        <TextField
          id="anniversary"
          aria-label="anniversary"
          label="Anniversary"
          variant="outlined"
          margin="dense"
          fullWidth
          value={anniversaryData.note}
          onChange={e => handleAnniversaryChange(e.target.value)}
        />
        <TextField
          id="note"
          aria-label="note"
          label="Note"
          variant="outlined"
          value={noteData.note}
          margin="dense"
          fullWidth
          multiline
          minRows={3}
          onChange={e => handleNoteChange(e.target.value)}
        />
        <ImagePicker config={config} imageSrcProp={initialImage} />
      </Stack>
      <Divider orientation="horizontal" variant="fullWidth" sx={{ width: '100%' }} />
      <Paper sx={{ width: '100%', borderRadius: 0 }} elevation={0}>
        <BottomNavigation showLabels>
          <BottomNavigationAction
            label={new Date(previousDay).toLocaleDateString()}
            icon={<ArrowBackIosIcon />}
            href={`/day/${previousDay}`}
          />
          <BottomNavigationAction label="Today" icon={<TodayIcon />} href={`/day/${today.valueOf()}`} />
          <BottomNavigationAction
            label={new Date(nextDay).toLocaleDateString()}
            icon={<ArrowForwardIosIcon />}
            href={`/day/${nextDay}`}
          />
        </BottomNavigation>
      </Paper>
    </Stack>
  );
};

export default Day;
