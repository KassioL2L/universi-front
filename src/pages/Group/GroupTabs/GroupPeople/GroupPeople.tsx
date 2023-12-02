import { useContext, useState } from "react";
import { Link } from "react-router-dom";

import { EMPTY_LIST_CLASS, GroupContext } from "@/pages/Group";
import { setStateAsValue } from "@/utils/tsxUtils";
import { ProfileClass } from "@/types/Profile";
import { ProfileImage } from "@/components/ProfileImage/ProfileImage";

import "./GroupPeople.less";
import { Filter } from "@/components/Filter/Filter";
import { AuthContext } from "@/contexts/Auth";
import { ActionButton } from "@/components/ActionButton/ActionButton";

export function GroupPeople() {
    const groupContext = useContext(GroupContext);
    const [filterPeople, setFilterPeople] = useState<string>("");
    const authContext = useContext(AuthContext);

    if (!groupContext)
        return null;

    return (
        <section id="people" className="group-tab">
            <div className="heading top-container">
                <div className="go-right">
                    <Filter setter={setFilterPeople} placeholderMessage={`Buscar em participantes de ${groupContext.group.name}`}/>
                </div>
            </div>

            <div className="people-list tab-list"> { makePeopleList(groupContext.participants, filterPeople) } </div>
        </section>
    );
}

function makePeopleList(people: ProfileClass[], filter: string) {
    if (people.length === 0) {
        return <p className={EMPTY_LIST_CLASS}>Esse grupo não possui participantes.</p>
    }

    const lowercaseFilter = filter.toLowerCase();
    const filteredPeople = filter.length === 0
        ? people
        : people.filter(p => (p.fullname ?? "").toLowerCase().includes(lowercaseFilter));

    if (filteredPeople.length === 0) {
        return <p className={EMPTY_LIST_CLASS}>Nenhum participante encontrado com a pesquisa.</p>
    }

    return filteredPeople
        .filter(p => !p.user.needProfile)
        .map(renderPerson);
}

function renderPerson(person: ProfileClass) {
    const linkToProfile = `/profile/${person.user.name}`;

    const imageUrl = person.image?.startsWith("/")
        ? `${import.meta.env.VITE_UNIVERSIME_API}${person.image}`
        : person.image;

    return (
        <div className="person-item tab-item" key={person.id}>
            <Link to={linkToProfile}>
                <ProfileImage imageUrl={imageUrl} className="person-image" />
            </Link>

            <div className="info">
                <Link to={linkToProfile} className="person-name">{person.fullname}</Link>
                <p className="person-bio">{person.bio}</p>
            </div>
        </div>
    );
}
