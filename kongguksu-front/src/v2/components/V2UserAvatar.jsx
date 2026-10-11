import React, { useState, useEffect } from 'react';
import Avatar from 'boring-avatars';

export const KONG_COLORS = ["#FFFDF0", "#FFD369", "#3D3D3D", "#A9B388", "#FF9F29"];

const V2UserAvatar = ({
  src,
  seed,
  name,
  variant = 'beam',
  size = 40,
  colors = KONG_COLORS,
  className = '',
  alt = '사용자 아바타',
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const avatarName = seed || name || 'default';

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setImageError(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 flex items-center justify-center ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <Avatar
        size={size}
        name={avatarName}
        variant={variant}
        colors={colors}
      />
    </div>
  );
};

export default V2UserAvatar;
