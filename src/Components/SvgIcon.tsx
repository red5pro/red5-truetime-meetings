import Icons from '../styles/sprite.svg';

interface SvgIconProps {
  name: string;
  color?: string;
  size?: number;
  viewBox?: string;
}

export const SvgIcon = ({ name, color, size, viewBox }: SvgIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox ? viewBox : '0 0 1000 500'}
      fill={color}
      stroke={color}
      style={{ display: 'block', ['--ci-primary-color' as string]: color }}
    >
      <use href={Icons + `#${name}`} />
    </svg>
  );
};
