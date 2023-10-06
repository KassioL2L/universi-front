export type AvailableTabs = "contents" | "files" | "groups" | "people";

export type GroupTabDefinition = {
    name: string,
    value: AvailableTabs,
};

export type GroupTabsProps = {
    tabs: GroupTabDefinition[];
    changeTab: (tab: AvailableTabs) => any;
};

export function GroupTabs(props: GroupTabsProps) {
    return (
        <nav id="group-tabs"> {
            props.tabs.map(t => {
                return (
                    <button value={t.value} key={t.value} onClick={_ => props.changeTab(t.value)}>
                        {t.name}
                    </button>
                );
            })
        } </nav>
    );
}
