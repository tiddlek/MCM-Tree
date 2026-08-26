function parsePage(page, species) {

    const trees = {};

    const reactionGrid = page.querySelector(".rxn-grid");

    if (!reactionGrid) {
        console.log("No reaction grid found for:", species);

        return {
            species: species,
            image: null,
            trees: trees
        };
    }

    /*
     * Root species image
     */

    const rootImageElement = page.querySelector(
        ".rxn-reactants .rxn-species-image img"
    );

    const speciesImage = rootImageElement
        ? new URL(
            rootImageElement.getAttribute("src"),
            "https://www.mcm.york.ac.uk"
        ).href
        : null;


    /*
     * Reaction grid
     */

    const products =
        reactionGrid.querySelectorAll(".rxn-products");

    const reactants =
        reactionGrid.querySelectorAll(".rxn-reactants");


    reactants.forEach((reaction, i) => {

        const reactantElements = reaction.querySelectorAll(
            ".rxn-species-image, span"
        );

        const reactantList = [];

        reactantElements.forEach((element) => {

            const name = element.textContent.trim();

            reactantList.push(name);
        });


        let category;

        if (
            reactantList.length === 1 &&
            reactantList[0] === species
        ) {

            category = "D";

        } else {

            category = reactantList.find(
                name => name !== species
            );
        }


        if (!trees[category]) {

            trees[category] = {
                species: species,
                reactant: category,
                reactions: []
            };
        }


        const productElements = products[i].querySelectorAll(
            "a.rxn-species-image, span"
        );

        const productList = [];


        productElements.forEach((product) => {

            const name = product.textContent.trim();

            const link = product.tagName === "A"
                ? product.getAttribute("href")
                : null;

            const image = product.querySelector("img");

            const imageUrl = image
                ? new URL(
                    image.getAttribute("src"),
                    "https://www.mcm.york.ac.uk"
                ).href
                : null;


            productList.push({
                species: name,
                link: link,
                image: imageUrl
            });
        });


        trees[category].reactions.push(productList);
    });


    /*
     * Return everything parsed from this page
     */

    return {
        species: species,
        image: speciesImage,
        trees: trees
    };
}

async function fetchPage(url) {

    const absoluteUrl = new URL(
        url,
        "https://www.mcm.york.ac.uk"
    ).href;

    const response = await fetch(absoluteUrl);

    if (!response.ok) {
        throw new Error(
            `Failed to fetch page: ${response.status}`
        );
    }

    const html = await response.text();

    const parser = new DOMParser();

    const page = parser.parseFromString(
        html,
        "text/html"
    );

    return page;
}

const marklistButton = document.querySelector(
    'button[id^="ml-add-"]'
);

if (marklistButton) {           

    const species = marklistButton.id.replace("ml-add-", "");
    console.log("Species:", species);


    const pageData = parsePage(
        document,
        species
    );

    console.log("Page data:", pageData);

    const trees = pageData.trees;
    const speciesImage = pageData.image;

    const treeList = Object.values(trees);


    let networkData = pageData;

    (async () => {

        console.log("Loading network data...");

        for (const tree of treeList) {

            for (const reaction of tree.reactions) {

                for (const product of reaction) {

                    if (!product.link) {
                        continue;
                    }

                    console.log(
                        "Fetching:",
                        product.species
                    );

                    const productPage =
                        await fetchPage(product.link);

                    const productData =
                        parsePage(
                            productPage,
                            product.species
                        );

                    product.trees =
                        productData.trees;

                    console.log(
                        "Parsed:",
                        product.species,
                        product
                    );
                }
            }
        }

        console.log("Network data loaded!");

    })();


    const networkButton = document.createElement("button");
    networkButton.textContent = "Tree";

    // Copy the classes from the MCM button
    networkButton.className = marklistButton.className;

    // Put NetworkMCM immediately after Add to marklist
    marklistButton.insertAdjacentElement(
        "afterend",
        networkButton
    );

    networkButton.addEventListener("click", () => {

        if (document.querySelector("#networkmcm-popup")) {
            return;
        }

        const popup = document.createElement("div");

        popup.id = "networkmcm-popup";

        popup.style.position = "fixed";
        popup.style.top = "480px";
        popup.style.left = "50%";

        popup.style.transform = "translate(-50%, -50%)";

        popup.style.width = "1400px";
        popup.style.height = "680px";

        popup.style.backgroundColor = "white";

        popup.style.border = "1px solid black";
        popup.style.borderRadius = "10px";

        popup.style.zIndex = "1000000";

        document.body.appendChild(popup);

        const shadow = popup.attachShadow({
            mode: "open"
        });

        const style = document.createElement("style");

        style.textContent = `

            .tree-child-reactant-bar {
                position: absolute;

                top: 20px;

                height: 2px;

                background: black;
            }

            .tree-child-trees {
                display: flex;
                justify-content: center;
                gap: 40px;
                position: relative;
                margin-top: 10px;
                padding-top: 10px;

            }

            .tree-child-trees::before {
                content: "";

                position: absolute;

                top: 0;
                left: 50%;

                width: 2px;
                height: 20px;

                background: black;

                transform: translateX(-50%);
            }

            .tree-child-trees::after {
            content: "";

            position: absolute;

            top: 0;
            left: 50%;

            width: 0;
            height: 2px;

            background: black;
        }

            .tree-child-tree {
                position: relative;
            }

            .tree-child-tree::before {
                content: "";

                display: block;

                width: 2px;
                height: 20px;

                background: black;

                margin: 10px auto 0;
            }

            .tree-child-tree .tree-reactant {
                margin-bottom: 0px;
            }

            .tree-product {
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .tree-branch a {
                color: #01637D;
                text-decoration: none;
                cursor: pointer;
            }

            .tree-branch a:hover {
                text-decoration: underline;
            }

            .tree-category-bar {
                position: absolute;

                top: 0;

                height: 2px;

                background: black;
                z-index: 0;
                pointer-events: none;

            }

            .tree-categories {
                display: flex;
                justify-content: center;
                gap: 40px;

                position: relative;

            }

            .tree-category {
                display: flex;
                flex-direction: column;
                align-items: center;

                position: relative;
                z-index: 1;
            }

            .tree-product-tree {
                position: relative;
            }

            .tree-horizontal-bar {
                position: absolute;

                top: 0px;

                height: 2px;

                background: black;
            }

            .tree-branches img {
                width: 80px;
                height: 80px;
                object-fit: contain;
                display: block;
                margin: 0 auto -5px;
            }

            .tree-root img {
                width: 80px;
                height: 80px;
                object-fit: contain;
                display: block;
                margin: 0 auto -10px;
            }

            .tree-container {
                text-align: center;
                padding: 20px;

                width: max-content;
            }

            .zoom-container {
                width: max-content;
                min-width: 100%;

                transform-origin: top left;
            }

            .tree-viewport {
                width: 100%;
                height: calc(100% - 50px);

                overflow: auto;
            }

            .tree-root {
                font-weight: bold;
                position: relative;

            }

            .tree-root::after {
                content: "";
                display: block;

                width: 2px;
                height: 20px;

                background: black;

                margin: 5px auto 0;
            }

            .tree-reactants {
                display: flex;
                justify-content: center;
                gap: 40px;

                position: relative;
            }

            .tree-reactants::before {
                content: "";

                position: absolute;

                top: 0;
                left: 0;
                right: 0;

                height: 2px;

                background: black;
            }

            .tree-reactant {
                position: relative;
                padding-top: 20px;
            }

            .tree-reactant::before {
                content: "";

                position: absolute;

                top: 0;
                left: 50%;

                width: 2px;
                height: 20px;

                background: black;

                transform: translateX(-50%);
            }

            .tree-reactant::after {
                content: "";

                display: block;

                width: 2px;
                height: 20px;

                background: black;

                margin: 0 auto;
            }

            .tree-branches {
                display: flex;
                justify-content: center;
                column-gap: 40px;

                position: relative;

            }

            .tree-branch {
                position: relative;
                padding-top: 20px;
            }

            .tree-branch::before {
                content: "";

                position: absolute;

                top: 0;
                left: 50%;

                width: 2px;
                height: 20px;

                background: black;

                transform: translateX(-50%);
            }
        `;

        shadow.appendChild(style);

        const titleBar = document.createElement("div");

        titleBar.textContent = `${species} Tree`;
        titleBar.style.fontSize = "18px";
        titleBar.style.fontWeight = "bold";

        titleBar.style.display = "flex";
        titleBar.style.justifyContent = "space-between";
        titleBar.style.alignItems = "center";

        titleBar.style.padding = "10px 15px";

        titleBar.style.borderBottom = "1px solid #ccc";

        shadow.appendChild(titleBar);

        const closeButton = document.createElement("button");

        closeButton.textContent = "×";

        closeButton.style.border = "none";
        closeButton.style.background = "none";

        closeButton.style.fontSize = "20px";
        closeButton.style.cursor = "pointer";
        closeButton.style.color = "#c71c1c";

        closeButton.addEventListener("click", () => {
            popup.remove();
        });

        titleBar.appendChild(closeButton);

        const treeViewport = document.createElement("div");

        treeViewport.className = "tree-viewport";

        shadow.appendChild(treeViewport);


        const zoomContainer = document.createElement("div");

        zoomContainer.className = "zoom-container";

        treeViewport.appendChild(zoomContainer);


        const treeContainer = document.createElement("div");

        treeContainer.className = "tree-container";

        zoomContainer.appendChild(treeContainer);

        let treeZoom = 1;

        function updateZoom() {

            zoomContainer.style.transform =
                `scale(${treeZoom})`;

            zoomContainer.style.transformOrigin =
                "top left";

            zoomContainer.style.width =
                `${treeContainer.scrollWidth * treeZoom}px`;

            zoomContainer.style.height =
                `${treeContainer.scrollHeight * treeZoom}px`;
        }

        treeViewport.addEventListener("wheel", (event) => {

            if (!event.ctrlKey) {
                return;
            }

            event.preventDefault();

            if (event.deltaY < 0) {
                treeZoom += 0.05;
            } else {
                treeZoom -= 0.05;
            }

            treeZoom = Math.max(0.3, Math.min(3, treeZoom));

            updateZoom();
            
        }, { passive: false });

        const root = document.createElement("div");

        root.className = "tree-root";

        if (speciesImage) {

            const rootImage = document.createElement("img");

            rootImage.src = speciesImage;

            root.appendChild(rootImage);
        }

        const rootName = document.createElement("div");
        rootName.textContent = species;

        root.appendChild(rootName);

        treeContainer.appendChild(root);

        const categoryContainer = document.createElement("div");

        categoryContainer.className = "tree-categories";

        treeContainer.appendChild(categoryContainer);
        
        const categoryBar = document.createElement("div");

        categoryBar.className = "tree-category-bar";

        categoryContainer.appendChild(categoryBar);

        function renderProductTree(product, parentContainer) {

            /*
            * This is the product itself
            */

            const branch = document.createElement("div");

            branch.className = "tree-branch";


            /*
            * Product image + name
            */

            const productElement =
                document.createElement("div");

            productElement.className =
                "tree-product";


            if (product.image) {

                const productImage =
                    document.createElement("img");

                productImage.src =
                    product.image;

                productElement.appendChild(
                    productImage
                );
            }


            if (product.link) {

                const productName =
                    document.createElement("a");

                productName.textContent =
                    product.species;

                productName.href =
                    new URL(
                        product.link,
                        "https://www.mcm.york.ac.uk"
                    ).href;

                productName.target = "_blank";

                productElement.appendChild(
                    productName
                );

            } else {

                const productName =
                    document.createElement("div");

                productName.textContent =
                    product.species;

                productElement.appendChild(
                    productName
                );
            }


            branch.appendChild(
                productElement
            );

            parentContainer.appendChild(
                branch
            );


            /*
            * Does this product have
            * reaction trees?
            */

            if (!product.trees) {
                return;
            }


            const trees =
                Object.values(product.trees);


            /*
            * Each tree corresponds to a
            * reactant category:
            *
            * NO
            * NO3
            * HO2
            * D
            */

            const childTrees =
                document.createElement("div");

            childTrees.className =
                "tree-child-trees";

            branch.appendChild(childTrees);


            // Horizontal bar connecting the reactants

            const childReactantBar =
                document.createElement("div");

            childReactantBar.className =
                "tree-child-reactant-bar";

            childTrees.appendChild(childReactantBar);

            for (const tree of trees) {

                /*
                * Container for this reaction branch
                */

                const reactionTree =
                    document.createElement("div");

                reactionTree.className =
                    "tree-child-tree";

                childTrees.appendChild(
                    reactionTree
                );


                /*
                * Reactant
                *
                * NISOPO2
                *     |
                *    NO
                */

                const reactant =
                    document.createElement("div");

                reactant.className =
                    "tree-reactant";

                reactant.textContent =
                    tree.reactant;

                reactionTree.appendChild(
                    reactant
                );


                /*
                * Products from this reaction
                */

                const childContainer =
                    document.createElement("div");

                childContainer.className =
                    "tree-branches";

                reactionTree.appendChild(
                    childContainer
                );


                /*
                * Render every reaction
                * associated with this reactant
                */

                for (const reaction of tree.reactions) {

                    for (const childProduct of reaction) {

                        renderProductTree(
                            childProduct,
                            childContainer
                        );
                    }
                }

                /*
                 * Add horizontal bar ONLY if there are
                 * multiple products.
                 */

                const childBranches =
                    childContainer.querySelectorAll(
                        ":scope > .tree-branch"
                    );

                if (childBranches.length > 1) {

                    const firstBranch =
                        childBranches[0];

                    const lastBranch =
                        childBranches[childBranches.length - 1];

                    const containerRect =
                        childContainer.getBoundingClientRect();

                    const firstRect =
                        firstBranch.getBoundingClientRect();

                    const lastRect =
                        lastBranch.getBoundingClientRect();

                    const firstCenter =
                        firstRect.left +
                        firstRect.width / 2 -
                        containerRect.left;

                    const lastCenter =
                        lastRect.left +
                        lastRect.width / 2 -
                        containerRect.left;

                    const horizontalBar =
                        document.createElement("div");

                    horizontalBar.className =
                        "tree-horizontal-bar";

                    horizontalBar.style.left =
                        `${firstCenter}px`;

                    horizontalBar.style.width =
                        `${lastCenter - firstCenter}px`;

                    childContainer.appendChild(
                        horizontalBar
                    );
                }
            }

            // Find all child reaction trees

            const childReactionTrees =
                childTrees.querySelectorAll(
                    ":scope > .tree-child-tree"
                );


            // Connect the first and last reactants

            if (childReactionTrees.length > 1) {

                const firstTree =
                    childReactionTrees[0];

                const lastTree =
                    childReactionTrees[childReactionTrees.length - 1];

                const containerRect =
                    childTrees.getBoundingClientRect();

                const firstRect =
                    firstTree.getBoundingClientRect();

                const lastRect =
                    lastTree.getBoundingClientRect();

                const firstCenter =
                    firstRect.left +
                    firstRect.width / 2 -
                    containerRect.left;

                const lastCenter =
                    lastRect.left +
                    lastRect.width / 2 -
                    containerRect.left;

                childReactantBar.style.left =
                    `${firstCenter}px`;

                childReactantBar.style.width =
                    `${lastCenter - firstCenter}px`;
            }
        }
        for (const tree of treeList) {

            // Create the category column

            const category = document.createElement("div");

            category.className = "tree-category";

            categoryContainer.appendChild(category);


            // Reactant

            const reactant = document.createElement("div");

            reactant.textContent = tree.reactant;

            reactant.className = "tree-reactant";

            category.appendChild(reactant);


            // Product tree

            const productTree = document.createElement("div");

            productTree.className = "tree-product-tree";

            category.appendChild(productTree);


            // Horizontal product bar

            const horizontalBar = document.createElement("div");

            horizontalBar.className = "tree-horizontal-bar";

            productTree.appendChild(horizontalBar);


            // Products / branches

            const branchContainer = document.createElement("div");

            branchContainer.className = "tree-branches";

            productTree.appendChild(branchContainer);


            /*
            * Products for THIS tree
            */

            for (const reaction of tree.reactions) {

                for (const product of reaction) {

                    renderProductTree(
                        product,
                        branchContainer
                    );
                }
            }


            /*
            * Find all branches belonging to THIS tree
            */

            const branches =
                branchContainer.querySelectorAll(
                    ":scope > .tree-branch"
                );


            if (branches.length > 0) {

                const firstBranch =
                    branches[0];

                const lastBranch =
                    branches[branches.length - 1];


                const firstCenter =
                    firstBranch.offsetLeft +
                    firstBranch.offsetWidth / 2;


                const lastCenter =
                    lastBranch.offsetLeft +
                    lastBranch.offsetWidth / 2;


                horizontalBar.style.left =
                    `${firstCenter}px`;


                horizontalBar.style.width =
                    `${lastCenter - firstCenter}px`;
            }
        }   

        const categories =
            categoryContainer.querySelectorAll(
                ":scope > .tree-category"
            );

        if (categories.length > 1) {

            const firstCategory = categories[0];
            const lastCategory = categories[categories.length - 1];

            const containerRect =
                categoryContainer.getBoundingClientRect();

            const firstRect =
                firstCategory.getBoundingClientRect();

            const lastRect =
                lastCategory.getBoundingClientRect();

            const firstCenter =
                firstRect.left +
                firstRect.width / 2 -
                containerRect.left;

            const lastCenter =
                lastRect.left +
                lastRect.width / 2 -
                containerRect.left;

            categoryBar.style.left =
                `${firstCenter}px`;

            categoryBar.style.width =
                `${lastCenter - firstCenter}px`;
        }

        requestAnimationFrame(() => {

            const treeWidth = treeContainer.scrollWidth;
            const treeHeight = treeContainer.scrollHeight;

            const viewportWidth = treeViewport.clientWidth;
            const viewportHeight = treeViewport.clientHeight;

            const widthZoom = viewportWidth / treeWidth;
            const heightZoom = viewportHeight / treeHeight;

            treeZoom = Math.min(widthZoom, heightZoom);

            // Don't zoom in beyond the normal size
            treeZoom = Math.min(treeZoom, 1);

            // Don't let it get ridiculously small
            treeZoom = Math.max(treeZoom, 0.3);

            updateZoom();

            requestAnimationFrame(() => {

                treeViewport.scrollLeft =
                    (zoomContainer.scrollWidth - treeViewport.clientWidth) / 2;

                treeViewport.scrollTop =
                    (zoomContainer.scrollHeight - treeViewport.clientHeight) / 2;
            });
        });
    });
}