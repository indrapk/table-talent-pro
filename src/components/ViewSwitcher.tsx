import React from 'react';
import { ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import { CalendarMonth, People, TableChart } from '@mui/icons-material';
import { ViewType, VIEW_CONFIGS } from '@/types/views';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  calendar: <CalendarMonth />,
  people: <People />,
  section: <TableChart />,
};

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ currentView, onViewChange }) => {
  const handleChange = (_: React.MouseEvent<HTMLElement>, newView: ViewType | null) => {
    if (newView !== null) {
      onViewChange(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={currentView}
      exclusive
      onChange={handleChange}
      aria-label="view switcher"
      size="small"
      sx={{
        bgcolor: 'grey.100',
        borderRadius: 2,
        '& .MuiToggleButton-root': {
          border: 'none',
          px: 2,
          py: 1,
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          },
        },
      }}
    >
      {VIEW_CONFIGS.map(view => (
        <Tooltip key={view.id} title={view.label}>
          <ToggleButton value={view.id} aria-label={view.label}>
            {iconMap[view.icon]}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
};

export default ViewSwitcher;
