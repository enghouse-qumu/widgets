export type Position = 'top-left' | 'top' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';

export interface WidgetStyle {
  borderRadius: string;
  closeButton: Partial<{
    activeBackgroundColor: string;
    activeColor: string;
    backgroundColor: string;
    borderRadius: string;
    boxShadow: string;
    color: string;
    hoverBackgroundColor: string;
    hoverColor: string;
    iconSize: string;
    padding: string;
  }>;
  dialog: Partial<{
    backdropColor: string;
    backgroundColor: string;
    border: string;
    borderRadius: string;
    maxWidth: string;
    padding: string;
    width: string;
  }>;
  height: string;
  notFound: Partial<{
    backgroundColor: string;
    border: string;
    color: string;
    iconColor: string;
  }>;
  playButton: Partial<{
    activeBackgroundColor: string;
    activeColor: string;
    backgroundColor: string;
    borderRadius: string;
    color: string;
    height: string;
    hoverBackgroundColor: string;
    hoverColor: string;
    margin: string;
    padding: string;
    position: Position;
    width: string;
  }>;
  thumbnail: Partial<{
    imageFit: string;
  }>;
  width: string;
}
