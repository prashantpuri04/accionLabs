
import { type ChartCardProps } from '../../types/charts';

export const ChartCard = (props: ChartCardProps) => {
  return (
    <div className={`chart-card ${props.className || ''}`}>
      <h2>{props.title}</h2>
      {props.subtitle && <p>{props.subtitle}</p>}
      {props.children}
      
    </div>
  );
}

//export default ChartCard;