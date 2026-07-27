import React from 'react';

function ResponsiveMascotImage({
  src,
  smallSrc,
  sizes = '(max-width: 768px) 45vw, 425px',
  alt = '',
  ...props
}) {
  return (
    <img
      src={src}
      srcSet={smallSrc ? `${smallSrc} 512w, ${src} 1024w` : undefined}
      sizes={smallSrc ? sizes : undefined}
      alt={alt}
      {...props}
    />
  );
}

export default ResponsiveMascotImage;
