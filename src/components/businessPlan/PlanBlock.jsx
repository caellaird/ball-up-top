import React from 'react';
import PlanParagraph from './PlanParagraph';
import PlanSubheading from './PlanSubheading';
import PlanBullets from './PlanBullets';
import PlanTable from './PlanTable';
import PlanFlow from './PlanFlow';
import PlanCallout from './PlanCallout';

export default function PlanBlock({ block }) {
  switch (block.t) {
    case 'h2':
      return <PlanSubheading text={block.text} />;
    case 'p':
      return <PlanParagraph text={block.text} />;
    case 'bullets':
      return <PlanBullets items={block.items} />;
    case 'table':
      return <PlanTable head={block.head} rows={block.rows} widths={block.widths} />;
    case 'flow':
      return <PlanFlow steps={block.steps} title={block.title} />;
    case 'callout':
      return <PlanCallout label={block.label} text={block.text} />;
    default:
      return null;
  }
}