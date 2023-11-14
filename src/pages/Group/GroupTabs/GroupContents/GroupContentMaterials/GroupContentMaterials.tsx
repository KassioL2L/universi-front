import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import UniversimeApi from "@/services/UniversimeApi";
import * as SwalUtils from "@/utils/sweetalertUtils";
import { EMPTY_LIST_CLASS, GroupContext, ManageMaterial } from "@/pages/Group";
import { setStateAsValue } from "@/utils/tsxUtils";
import { ContentStatusEnum, type Content } from "@/types/Capacity";

import "./GroupContentMaterials.less";
import { VideoPopup } from "@/components/VideoPopup/VideoPopup";
import { ContentStatusEdit_RequestDTO } from "@/services/UniversimeApi/Capacity";
import { renderOption, type OptionInMenu, hasAvailableOption } from "@/utils/dropdownMenuUtils";

export function GroupContentMaterials() {
    const groupContext = useContext(GroupContext);
    const [materials, setMaterials] = useState<Content[]>();
    const [filterMaterials, setFilterMaterials] = useState<string>("");
    const [playingVideo, setPlayingVideo] = useState("")
    const [isMiniature, setIsMiniature] = useState(false)


    useEffect(() => {
        refreshMaterials();
    }, [groupContext?.currentContent?.id]);

    if (groupContext === null || materials === undefined || groupContext.currentContent === undefined) {
        return null;
    }

    const organizationName = groupContext.group.organization
        ? <Link to={`/group/${groupContext.group.organization.path}`} className="title-hyperlink">{groupContext.group.organization.name} &gt; </Link>
        : null;

    const groupName = <div onClick={() => groupContext.setCurrentContent(undefined)} style={{cursor: "pointer", display: "inline"}}>{groupContext.group.name}</div>

    const OPTIONS_DEFINITION: OptionInMenu<Content>[] = [
        {
            text: "Editar",
            biIcon: "pencil-fill",
            onSelect(data) {
                groupContext.setEditMaterial(data);
            },
            hidden() {
                return groupContext?.group.admin.id !== groupContext?.loggedData.profile.id;
            },
        },
        {
            text: "Excluir",
            biIcon: "trash-fill",
            className: "delete",
            onSelect: handleDeleteMaterial,
            hidden() {
                return groupContext?.group.admin.id !== groupContext?.loggedData.profile.id;
            },
        }
    ];

    return (
        <section id="materials" className="group-tab">
            <div className="heading top-container">
                <div className="title-container">
                    <i className="bi bi-list-ul tab-icon"/>
                    <h2 className="title">{organizationName}{groupName} &gt; {groupContext.currentContent.name}</h2>
                </div>
                <div className="go-right">
                    <div id="filter-wrapper">
                        <i className="bi bi-search filter-icon"/>
                        <input type="search" name="filter-materials" id="filter-materials" className="filter-input"
                            onChange={setStateAsValue(setFilterMaterials)} placeholder={`Buscar em ${groupContext.group.name}`}
                        />
                    </div>
                </div>
            </div>

            <div className="material-list"> { makeMaterialsList(materials, filterMaterials) } </div>

            <ManageMaterial refreshMaterials={refreshMaterials} />
        </section>
    );

    function refreshMaterials() {
        const contentId = groupContext?.currentContent?.id;
        if (!contentId) {
            return;
        }

        UniversimeApi.Capacity.contentsInFolder({id: contentId})
            .then(response => {
                if (!response.success || !response.body) {
                    SwalUtils.fireModal({
                        titleText: "Erro ao acessar conteúdo",
                        text: response.message,
                        confirmButtonText: "Voltar aos conteúdos",
                    })
                        .then(result => {
                            if (result.isConfirmed)
                                groupContext.setCurrentContent(undefined);
                        })

                    return;
                }

                setMaterials(response.body.contents);
            });
    }

    function makeMaterialsList(materials: Content[], filter: string) {
        if (materials.length === 0) {
            return <p className={EMPTY_LIST_CLASS}>Esse conteúdo não possui materiais.</p>
        }

        const filteredMaterials = filter.length === 0
            ? materials
            : materials.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()));

        if (filteredMaterials.length === 0) {
            return <p className={EMPTY_LIST_CLASS}>Nenhum material encontrado com a pesquisa.</p>
        }

        return filteredMaterials
            .map(renderMaterial);
    }

    function renderMaterial(material: Content) {
        const youTubeMatch = YOU_TUBE_MATCH.exec(material.url);

        return (
            <div className="material-item tab-item" key={material.id}>
                {
                    youTubeMatch !== null
                        ? renderYouTubeEmbed(youTubeMatch, material)
                        :
                        <Link to={material.url} target="_blank" className="material-name icon-container">
                            {
                                material.type === "FILE"
                                    ?
                                        <img src={`/assets/imgs/file.png`} className="material-image"></img>
                                : material.type === "FOLDER"
                                    ?
                                        <img src={`/assets/imgs/file.png`} className="material-image"></img>
                                :
                                        <img src={`/assets/imgs/link.png`} className="material-image"></img>
                            }
                        </Link>
                }
                <div className="info">
                {
                    youTubeMatch !== null
                    ?
                        <div className="material-name"   onClick={() => { const videoId = (youTubeMatch[1] ?? youTubeMatch[2]); if(!isMiniature || videoId!= playingVideo) handleVideoClick(videoId)}}>
                            {material.title}
                        </div>
                    :
                        <Link to={material.url} target="_blank" className="material-name">
                            {material.title}
                        </Link>
                }
                    <p className="material-description">{material.description}</p>
                </div>

            { !hasAvailableOption(OPTIONS_DEFINITION) ? null :
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button className="material-options-button">
                            <i className="bi bi-three-dots-vertical" />
                        </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Content className="material-options" side="left">
                        { OPTIONS_DEFINITION.map(def => renderOption(material, def)) }
                        <DropdownMenu.Arrow className="material-options-arrow" height=".5rem" width="1rem" />
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            }
            </div>
        );
    }

    function renderYouTubeEmbed(videoUrl: RegExpExecArray, material : Content) {
        const videoId = videoUrl[1] ?? videoUrl[2];

        return (
            <div className="icon-container" id={`icon-container-${videoId}`} onClick={() => {if(!isMiniature || videoId != playingVideo) handleVideoClick(videoId)}}>
                <img src="/assets/imgs/video.png" className="material-image"></img>
                {
                    playingVideo == videoId
                    ? <VideoPopup material={material} id={videoId} handleClose={handleVideoClose} handleWatched={(event) => handleWatchedButton(material, event)}/>
                    : <></>
                }
            </div>
        )
    }

    async function handleWatchedButton(material : Content, event : any){

        event.stopPropagation();
        console.log(material)

        let nextStatus : ContentStatusEnum = material.contentStatus.status == "DONE"  ? "NOT_VIEWED" : "DONE"

        console.log(nextStatus)
        console.log(material.contentStatus.status)


        await UniversimeApi.Capacity.createContentStatus({contentId : material.id});
        await UniversimeApi.Capacity.editContentStatus({contentId: material.id, contentStatusType : nextStatus}).then(
            (data : ContentStatusEdit_RequestDTO) => {
                if(data.contentStatusType == "DONE" || data.contentStatusType == "NOT_VIEWED")
                    material.contentStatus.status = data.contentStatusType
            }
        )

        refreshMaterials()


    }

    function handleVideoClick(id : string){
        if(playingVideo == id){
            showMiniature(id)
        }
        else{
            setIsMiniature(false)
            setPlayingVideo(id)
        }
    }

    function getVideoContainers() : {[key : string] : HTMLElement | null} {

        let elements : {[key : string] : HTMLElement | null} = {};

        let popupContainer = document.getElementById("popup-container")
        let close = document.getElementById("close")
        let iframeContainer = document.getElementById("iframe-container");

        elements.popupContainer = popupContainer;
        elements.close = close;
        elements.iframeContainer = iframeContainer;

        return elements
    }


    function expand(id : string){

        let containers = getVideoContainers()
        console.log(containers)

        containers.popupContainer?.classList.remove("mini-player")
        containers.popupContainer?.classList.add("popup-container")
        containers.iframeContainer?.classList.remove("mini-iframe")
        containers.iframeContainer?.classList.add("iframe-container")
        if(containers.close){
            containers.close.innerHTML = "✖";
            containers.close.onclick = () => { handleVideoClose}
        }
        setIsMiniature(false)


    }

    function showMiniature(id : string){

        let containers = getVideoContainers()

        containers.popupContainer?.classList.remove("popup-container")
        containers.popupContainer?.classList.add("mini-player")
        containers.iframeContainer?.classList.remove("iframe-container")
        containers.iframeContainer?.classList.add("mini-iframe")
        if(containers.close){
            containers.close.innerHTML = "&#x26F6;"
            containers.close.onclick = () => { handleVideoClose}
        }
        setIsMiniature(true)

    }

    function handleVideoClose(id : string, symbol : string){

        if(symbol == "✖"){
            setPlayingVideo("")
            setIsMiniature(false)
            return
        }
        expand(id)


    }

    function handleDeleteMaterial(material: Content) {
        SwalUtils.fireModal({
            showCancelButton: true,

            cancelButtonText: "Cancelar",
            confirmButtonText: "Remover",
            confirmButtonColor: "var(--alert-color)",

            text: "Tem certeza que deseja remover este conteúdo deste grupo?",
            icon: "warning",
        }).then(res => {
            if (res.isConfirmed) {
                const currentContentId = groupContext?.currentContent?.id!;

                UniversimeApi.Capacity.removeContentFromFolder({ folderId: currentContentId, contentIds: material.id })
                    .then(res => {
                        if (!res.success)
                            return;

                        refreshMaterials();
                    });
            }
        });
    }
}



const YOU_TUBE_MATCH = /^(?:https:\/\/)?(?:(?:www\.youtube\.com\/watch\?v=([-A-Za-z0-9_]{11,}))|(?:youtu\.be\/([-A-Za-z0-9_]{11,})))/;
