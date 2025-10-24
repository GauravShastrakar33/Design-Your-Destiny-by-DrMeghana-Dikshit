import { useState } from 'react';
import SegmentedControl from '../SegmentedControl';

export default function SegmentedControlExample() {
  const [selected, setSelected] = useState('DYD');
  
  return (
    <SegmentedControl
      options={['DYD', 'USM']}
      selected={selected}
      onChange={setSelected}
    />
  );
}
