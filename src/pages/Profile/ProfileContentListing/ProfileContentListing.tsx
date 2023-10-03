import UniversimeApi from "@/services/UniversimeApi";
import { Content } from "@/types/Capacity";
import { useEffect, useState } from "react";
import { ProfileContentItem } from "../ProfileContentItem/ProfileContentItem";
import "./ProfileContentListing.css"

export function ProfileContentListing({amount = -1}){

    const [availableContents, setAvailableContents] = useState<Content[]>([])

    useEffect( () =>{
        UniversimeApi.Capacity.contentList()
        .then(res => setAvailableContents(res.body.contents))
    }, [])

    useEffect(() => {
        const extractVideoId = (url: string) => {
          const regExp = /^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
          const match = url.match(regExp);
          if (match && match[1].length === 11) {
            return match[1];
          }
        };
    
        const updateThumbnailImage = (content : Content) => {
          const videoId = extractVideoId(content.url);
          if (videoId) {
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            content.image = thumbnailUrl
          }
        };
    
        // const contentThumbnails = document.querySelectorAll('.content-thumbnail');
        // contentThumbnails.forEach(updateThumbnailImage);
        availableContents.forEach(updateThumbnailImage)

        if(amount != -1)
            setAvailableContents(availableContents.slice(1, amount))

      }, [availableContents]);

      return(
        <div>
            <h1 className="content-name">Meus conteúdos</h1>
            <div className="contents">
                {
                    availableContents.length === 0 ? <p>Nenhum conteúdo no momento</p> :  

                    availableContents.map((content) =>(
                        <div>
                          <ProfileContentItem content_={content}></ProfileContentItem>
                        </div>
                    ))
                }
            </div>
        </div>
      )



}