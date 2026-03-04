import { createTheme, responsiveFontSizes, Theme } from '@mui/material/styles';
import { ThemeList } from '../constants/themeList';
import { getBlackTheme } from './blackTheme';
import { getBlueTheme } from './blueTheme';

const getTheme = (theme: string): Theme => {
  let themeObject: Theme;

  switch (theme) {
    case ThemeList.Black:
      themeObject = getBlackTheme();
      break;
    case ThemeList.Blue:
      themeObject = getBlueTheme();
      break;
    default:
      themeObject = getBlackTheme();
  }

  const createdTheme = createTheme(themeObject);
  return responsiveFontSizes(createdTheme);
};

export default getTheme;
