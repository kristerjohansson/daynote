/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import './ImagePicker.css';

export interface ImagePickerConf {
  width?: string;
  height?: string;
  borderRadius?: string;
  aspectRatio?: number | null;
  objectFit?: 'cover' | 'contain' | 'fill' | 'revert' | 'scale-down';
  compressInitial?: number | undefined | null;
  language?: string;
  hideDeleteBtn?: boolean;
  hideDownloadBtn?: boolean;
  hideEditBtn?: boolean;
  hideAddBtn?: boolean;
}

interface ICacheData {
  lastImage: string;
  originImageSrc: string;
  width: number;
  height: number;
  quality: number;
  format: string;
  basicFilters?: IBasicFilterState | null | undefined;
}

interface IBasicFilterState {
  contrast: number;
  blur: number;
  brightness: number;
  grayscale: number;
  invert: number;
  saturate: number;
  sepia: number;
}

interface IState {
  quality: number;
  maxHeight: number;
  maxWidth: number;
  cropHeight: number;
  cropWidth: number;
  maintainAspectRatio: boolean;
  format: string;
  arrayCopiedImages: Array<ICacheData>;
  originImageSrc: string | null | undefined;
  basicFilters?: IBasicFilterState;
}

const initialConfig: ImagePickerConf = {
  language: 'en',
  objectFit: 'cover',
  hideDeleteBtn: false,
  hideDownloadBtn: false,
  hideEditBtn: false,
  hideAddBtn: false,
  compressInitial: null,
};

const initialState: IState = {
  maxHeight: 3000,
  maxWidth: 3000,
  cropHeight: 150,
  cropWidth: 150,
  maintainAspectRatio: true,
  format: 'jpeg',
  arrayCopiedImages: [],
  originImageSrc: '',
  basicFilters: undefined,
  quality: 100,
};

interface ImagePickerProps {
  config: ImagePickerConf;
  imageSrcProp?: string;
  imageChanged?: (imageSrc: string | null) => void;
}

const ImagePicker: React.FC<ImagePickerProps> = ({
  config,
  imageSrcProp = '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  imageChanged = () => {},
}: ImagePickerProps) => {
  const [state, setState] = useState<IState>({
    ...initialState,
  });
  const [imageSrc, setImageSrc] = useState<string | null>('');
  const [loadImage, setLoadImage] = useState<boolean>(false);
  const [configuration, setConfiguration] = useState<ImagePickerConf>(initialConfig);
  const imagePicker = useRef<HTMLInputElement>(null);
  const fileType = useRef('');
  const urlImage = useRef('');
  const uuidFilePicker = Date.now().toString(20);
  const imageName = useRef('download');
  // const mounted = useRef(false);

  useEffect(() => {
    appendLinkIconsToHead();
    processConfig();
  }, [config]);

  useEffect(() => {
    loadImageFromProps();
  }, [imageSrcProp]);

  async function loadImageFromProps() {
    if (imageSrcProp) {
      const result = await parseToBase64(imageSrcProp);
      const newState: IState = result.state;
      newState.originImageSrc = imageSrcProp;
      newState.arrayCopiedImages = [
        {
          lastImage: result.imageUri,
          width: newState.maxWidth,
          height: newState.maxHeight,
          quality: newState.quality,
          format: newState.format,
          originImageSrc: imageSrcProp,
        },
      ];
      // console.log("NEW STATE", newState)
      setImageSrc(result.imageUri);
      setState(newState);
      setLoadImage(true);
    } else {
      const newState = { ...state };
      newState.originImageSrc = null;
      newState.arrayCopiedImages = [];
      setLoadImage(false);
      setImageSrc(null);
      setState(newState);
    }
  }

  useEffect(() => {
    imageChanged(imageSrc);
  }, [imageSrc]);

  function processConfig() {
    const dataConf = { ...configuration, ...config };
    setConfiguration(dataConf);
  }

  function appendLinkIconsToHead() {
    const head: HTMLElement = document.head;
    const linkIcons: HTMLElement | null = head.querySelector('#ngp-image-picker-icons-id');
    if (linkIcons) return;
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    link.rel = 'stylesheet';
    link.id = 'ngp-image-picker-icons-id';
    head.appendChild(link);
  }

  function onUpload(event: React.MouseEvent) {
    event.preventDefault();
    imagePicker?.current?.click();
  }

  function handleFileSelect(this: typeof handleFileSelect, event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target?.files;
    if (files) {
      const file = files[0];
      imageName.current = file.name.split('.')[0];
      fileType.current = file.type;
      if (!fileType.current.includes('image')) return;
      urlImage.current = `data:${file.type};base64,`;
      if (file) {
        setState({ ...state, format: fileType.current.split('image/')[1] });
        const reader = new FileReader();
        reader.onload = handleReaderLoaded.bind(this);
        reader.readAsBinaryString(file);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleReaderLoaded(readerEvt: any) {
    const binaryString = readerEvt.target.result;
    const base64textString = btoa(binaryString);
    const newState = { ...state };
    const newImageSrc = urlImage.current + base64textString;
    newState.originImageSrc = urlImage.current + base64textString;
    // if (configuration.compressInitial) {
    //   newState = {
    //     ...newState,
    //     quality: Math.min(configuration.compressInitial || 92, 100),
    //     maintainAspectRatio: true,
    //     format: 'jpeg',
    //   };
    //   let result = await convertImageUsingCanvas(newState.originImageSrc as string, false, newState, {
    //     getDimFromImage: true,
    //   });
    //   setState(result.state);
    //   setImageSrc(result.imageUri);
    //   setLoadImage(true);
    // } else {
    const img = document.createElement('img');
    img.src = newImageSrc;
    img.onload = () => {
      newState.arrayCopiedImages = [];
      newState.maxHeight = img.height;
      newState.maxWidth = img.width;
      newState.format = fileType.current.split('image/')[1];
      newState.arrayCopiedImages.push({
        lastImage: newImageSrc,
        width: img.width,
        height: img.height,
        quality: newState.quality,
        format: fileType.current.split('image/')[1],
        originImageSrc: newState.originImageSrc as string,
      });
      setState(newState);
      setImageSrc(newImageSrc);
      setLoadImage(true);
    };
    // }
  }

  function parseToBase64(imageUrl: string): Promise<{ imageUri: string; state: IState }> {
    let newState = { ...state };
    const types = imageUrl.split('.');
    const type = types[types.length - 1];
    if (type && (type == 'png' || type == 'jpeg' || type == 'webp')) {
      newState.format = type;
    } else {
      newState.format = 'jpeg';
    }
    if (config.compressInitial != null) {
      let quality = 1;
      if (config.compressInitial >= 0 && config.compressInitial <= 100) {
        quality = config.compressInitial;
      }
      newState.quality = quality;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      newState.maxHeight = img.height;
      newState.maxWidth = img.width;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
        const ratio = 1.0;
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        console.log(newState.quality);
        const dataURI = canvas.toDataURL(`image/${type}`, newState.quality / 100);
        return resolve({
          dataUri: dataURI,
          width: canvas.width,
          height: canvas.height,
        });
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      img.onerror = (e: any) => reject(e.message || `Error loading the src = ${imageUrl}`);
      img.src = imageUrl;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).then((data: any) => {
      newState = {
        ...newState,
        maxHeight: data.height,
        maxWidth: data.width,
      };
      return { imageUri: data.dataUri, state: newState };
    });
  }

  function onRemove() {
    setImageSrc(null);
    setLoadImage(false);
    const newState: IState = {
      ...state,
      ...initialState,
    };
    setState(newState);
  }

  return (
    <div className="ImagePicker">
      {!loadImage && (
        <div className="place-image">
          <div
            className="image-holder"
            style={{
              width: configuration.width,
              height: configuration.height,
              borderRadius: configuration.borderRadius,
              aspectRatio: configuration.aspectRatio + '',
            }}
          >
            <button title="Upload an image" className="icon-btn image-upload-btn" onClick={onUpload}>
              <span className="material-icons">add_a_photo</span>
            </button>

            <input
              ref={imagePicker}
              type="file"
              style={{ display: 'none' }}
              id={'filePicker-' + uuidFilePicker}
              onChange={handleFileSelect}
            />
          </div>
        </div>
      )}
      {loadImage && (
        <div className="place-image">
          <div
            className="image-holder-loaded"
            style={{
              width: configuration.width,
              height: configuration.height,
              borderRadius: configuration.borderRadius,
              aspectRatio: configuration.aspectRatio + '',
            }}
          >
            <img
              src={imageSrc as string}
              alt="image-loaded"
              style={{
                borderRadius: configuration.borderRadius,
                objectFit: configuration.objectFit,
              }}
            />
            <div className="curtain" onClick={onUpload}>
              <button title="Upload an image">
                <span className="material-icons">add_a_photo</span>
              </button>
            </div>
            <input
              ref={imagePicker}
              type="file"
              style={{ display: 'none' }}
              id={'filePicker-' + uuidFilePicker}
              onChange={handleFileSelect}
            />
          </div>

          <div
            style={{
              flexDirection: 'row',
              boxSizing: 'border-box',
              display: 'flex',
              placeContent: 'flex-start',
              alignItems: 'flex-start',
            }}
            className="editing-bar-btn"
          >
            {!configuration.hideAddBtn && (
              <button className="icon-btn" id="upload-img" title="Upload an image" onClick={onUpload}>
                <span className="material-icons">add_a_photo</span>
              </button>
            )}

            {!configuration.hideDeleteBtn && (
              <button className="icon-btn" id="delete-img" title="Remove" onClick={() => onRemove()}>
                <span className="material-icons">delete</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePicker;
