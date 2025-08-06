import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Typography } from '@mui/joy';
import { useColorScheme } from '@mui/joy';
import theme from '../../styles/theme';

const content = `
# Based on the lumbar spine X-ray, Aaron Black's diagnoses include:

* Mild degenerative changes at L4-L5, evidenced by disc space narrowing.
* No acute fractures or significant bony abnormalities of the lumbar spine.
* Incidental finding of a calcification in the left upper quadrant of the abdomen, likely a calcified gallstone.
`;

const MarkdownRenderer = () => {
  const { mode } = useColorScheme();

  return (
    <section className="max-w-3xl mx-auto px-4">
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    </section>
  );
};

export default MarkdownRenderer;
